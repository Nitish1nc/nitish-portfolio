#!/usr/bin/env node
/**
 * Publish an Obsidian/markdown note to nitishchauhan.com/writes/<slug>/
 * then run the existing deploy (OG screenshot + rsync).
 *
 *   npm run writes:publish -- "/path/to/note.md"
 *   npm run writes:publish -- note.md --slug my-slug --no-deploy
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITES = path.join(ROOT, "public", "writes");
const TEMPLATE = path.join(WRITES, "_article.html");
const HUB = path.join(WRITES, "index.html");

function usage() {
  console.log(`writes:publish — ship a markdown note to /writes/<slug>/

Usage:
  node scripts/writes-publish.mjs <note.md> [--slug slug] [--kicker "text"] [--date "12 Sep 2026"]
                                  [--description "text"] [--force] [--no-deploy]

Does not publish to library.nitishchauhan.com. Does not change homepage OG.
`);
}

function parseArgs(argv) {
  const out = { _: [], force: false, deploy: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") out.force = true;
    else if (a === "--no-deploy") out.deploy = false;
    else if (a === "--slug") out.slug = argv[++i];
    else if (a === "--kicker") out.kicker = argv[++i];
    else if (a === "--date") out.date = argv[++i];
    else if (a === "--description") out.description = argv[++i];
    else if (a === "-h" || a === "--help") out.help = true;
    else if (a.startsWith("-")) {
      console.error("Unknown flag:", a);
      process.exit(2);
    } else out._.push(a);
  }
  return out;
}

function slugify(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, body: raw };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return { fm, body: raw.slice(m[0].length) };
}

function inlineMd(s) {
  let t = escapeHtml(s);
  t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  t = t.replace(/\[\[([^\]]+)\]\]/g, "$1");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  t = t.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,]|$)/g, "$1<em>$2</em>");
  t = t.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,]|$)/g, "$1<em>$2</em>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

function mdToHtml(md, title) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let skippedTitleH1 = false;
  const flushPara = (buf) => {
    const t = buf.join(" ").trim();
    if (t) out.push(`      <p>${inlineMd(t)}</p>`);
  };

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      i += 1;
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      out.push("      <hr />");
      i += 1;
      continue;
    }
    const hm = line.match(/^(#{1,3})\s+(.*)$/);
    if (hm) {
      const level = hm[1].length;
      const text = hm[2].trim();
      if (level === 1 && !skippedTitleH1 && text.replace(/[*_]/g, "") === title) {
        skippedTitleH1 = true;
        i += 1;
        continue;
      }
      const tag = level === 1 ? "h2" : level === 2 ? "h2" : "h3";
      out.push(`      <${tag}>${inlineMd(text)}</${tag}>`);
      i += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      out.push(`      <blockquote>${inlineMd(buf.join(" "))}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`        <li>${inlineMd(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i += 1;
      }
      out.push(`      <ul>\n${items.join("\n")}\n      </ul>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`        <li>${inlineMd(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i += 1;
      }
      out.push(`      <ol>\n${items.join("\n")}\n      </ol>`);
      continue;
    }
    const buf = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^#{1,3}\s/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) && !/^---+\s*$/.test(lines[i])) {
      buf.push(lines[i]);
      i += 1;
    }
    flushPara(buf);
  }
  return out.join("\n");
}

function firstParagraph(md) {
  const text = md
    .replace(/^#+\s+.*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_`>#\[\]]/g, "")
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .find((p) => p.length > 40) || "";
  return text.slice(0, 157).replace(/\s+\S*$/, "") + (text.length > 157 ? "…" : "");
}

function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return formatDate(new Date());
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function fill(tpl, map) {
  return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => (k in map ? map[k] : ""));
}

function upsertHub(slug, title, dateLabel) {
  let html = readFileSync(HUB, "utf8");
  const item = `        <li>
          <a href="/writes/${slug}/">${escapeHtml(title)}</a>
          <small>${escapeHtml(dateLabel)} · ${escapeHtml(slug)}</small>
        </li>`;
  const re = new RegExp(
    `\\s*<li>\\s*<a href="/writes/${slug}/">[\\s\\S]*?</li>`,
  );
  if (re.test(html)) {
    html = html.replace(re, `\n${item}`);
  } else {
    html = html.replace('<ul class="list">', `<ul class="list">\n${item}`);
  }
  writeFileSync(HUB, html);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length < 1) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const notePath = path.resolve(args._[0]);
  if (!existsSync(notePath)) {
    console.error("Note not found:", notePath);
    process.exit(1);
  }
  if (!existsSync(TEMPLATE)) {
    console.error("Missing article template:", TEMPLATE);
    process.exit(1);
  }

  const raw = readFileSync(notePath, "utf8");
  const { fm, body } = parseFrontmatter(raw);
  const title =
    (fm.title || "").trim() ||
    (body.match(/^#\s+(.+)$/m) || [])[1]?.replace(/[*_]/g, "").trim() ||
    path.basename(notePath, path.extname(notePath));
  const slug = slugify(args.slug || title);
  if (!slug) {
    console.error("Could not derive slug. Pass --slug.");
    process.exit(1);
  }

  const dest = path.join(WRITES, slug);
  if (existsSync(path.join(dest, "index.html")) && !args.force) {
    console.error(`Exists: ${path.relative(ROOT, dest)}  (pass --force to overwrite)`);
    process.exit(1);
  }

  const dateLabel = args.date || (fm.date ? formatDate(fm.date) : formatDate(new Date()));
  const description = (args.description || fm.description || firstParagraph(body) || title).trim();
  const kicker = args.kicker ?? fm.kicker ?? "";
  const articleBody = mdToHtml(body, title);
  const html = fill(readFileSync(TEMPLATE, "utf8"), {
    TITLE: escapeHtml(title),
    DESCRIPTION: escapeHtml(description),
    SLUG: slug,
    DATE: escapeHtml(dateLabel),
    BODY: articleBody,
  });

  mkdirSync(dest, { recursive: true });
  writeFileSync(path.join(dest, "index.html"), html);
  writeFileSync(
    path.join(dest, "og.json"),
    JSON.stringify({ title, kicker }, null, 2) + "\n",
  );
  upsertHub(slug, title, dateLabel);

  console.log(`wrote public/writes/${slug}/`);
  console.log(`url    https://www.nitishchauhan.com/writes/${slug}/`);

  if (!args.deploy) {
    console.log("skipping deploy (--no-deploy)");
    return;
  }

  execFileSync("bash", [path.join(ROOT, "scripts", "deploy.sh")], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

main();
