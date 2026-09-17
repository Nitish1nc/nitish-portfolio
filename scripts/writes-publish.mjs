#!/usr/bin/env node
/**
 * Publish a markdown note to nitishchauhan.com/writes/<slug>/.
 * First image in the file is the share preview (og.png). The rest is the article.
 * Title comes from frontmatter, first # heading, or the filename.
 *
 *   npm run writes:publish -- "/path/to/note.md"
 *   npm run writes:share -- "/path/to/note.md"     # same, then git push
 *   npm run writes:publish -- note.md --slug my-slug --no-deploy
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
                                  [--description "text"] [--force] [--no-deploy] [--push]

First image in the note becomes og.png (share preview). Remaining markdown is the article.
--push commits only Writes files and git-pushes (GitHub Actions deploys).
--no-deploy writes files only. Default without --push is local rsync deploy.

Does not publish to library.nitishchauhan.com. Does not change homepage OG.
`);
}

function parseArgs(argv) {
  const out = { _: [], force: false, deploy: true, push: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") out.force = true;
    else if (a === "--no-deploy") out.deploy = false;
    else if (a === "--push") out.push = true;
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

function peelFirstImage(md, noteDir) {
  const patterns = [
    { re: /!\[[^\]]*\]\(([^)]+)\)/, group: 1 },
    { re: /!\[\[([^\]|#]+)\]\]/, group: 1 },
    { re: /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*\/?>/i, group: 1 },
  ];
  for (const p of patterns) {
    const m = md.match(p.re);
    if (!m) continue;
    const rawSrc = m[p.group].trim().replace(/^<|>$/g, "");
    const body = (md.slice(0, m.index) + md.slice(m.index + m[0].length)).replace(/^\n+/, "");
    if (/^https?:\/\//i.test(rawSrc)) {
      return { body, src: null, warn: `preview image is a URL (not copied): ${rawSrc}` };
    }
    const src = path.resolve(noteDir, rawSrc.replace(/^file:\/\//, ""));
    return { body, src, warn: existsSync(src) ? null : `preview image not found: ${src}` };
  }
  return { body: md, src: null, warn: "no image in the note; share preview will be missing until you add one" };
}

function writeOgPng(src, destPng) {
  mkdirSync(path.dirname(destPng), { recursive: true });
  const ext = path.extname(src).toLowerCase();
  if (ext === ".png") {
    copyFileSync(src, destPng);
    return;
  }
  try {
    execFileSync("sips", ["-s", "format", "png", src, "--out", destPng], { stdio: "pipe" });
  } catch {
    copyFileSync(src, destPng);
  }
}

function gitPushWrites(slug, title) {
  const paths = [
    path.join("public", "writes", slug),
    path.join("public", "writes", "index.html"),
  ];
  execFileSync("git", ["add", "--", ...paths], { cwd: ROOT, stdio: "inherit" });
  const staged = execFileSync("git", ["diff", "--cached", "--name-only"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  if (!staged) {
    console.log("git: nothing new to commit");
    return;
  }
  execFileSync("git", ["commit", "-m", `Publish writes/${slug}: ${title}`], {
    cwd: ROOT,
    stdio: "inherit",
  });
  execFileSync("git", ["push", "origin", "HEAD"], { cwd: ROOT, stdio: "inherit" });
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
  const { fm, body: rawBody } = parseFrontmatter(raw);
  const title =
    (fm.title || "").trim() ||
    (rawBody.match(/^#\s+(.+)$/m) || [])[1]?.replace(/[*_]/g, "").trim() ||
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

  const coverFm = (fm.image || fm.cover || fm.og || "").trim();
  let peeled = peelFirstImage(rawBody, path.dirname(notePath));
  if (coverFm && !/^https?:\/\//i.test(coverFm)) {
    const coverPath = path.resolve(path.dirname(notePath), coverFm);
    if (existsSync(coverPath)) peeled = { body: peeled.body, src: coverPath, warn: null };
  }
  const body = peeled.body;
  if (peeled.warn) console.warn("writes:publish:", peeled.warn);

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
  if (peeled.src) {
    writeOgPng(peeled.src, path.join(dest, "og.png"));
    console.log(`preview og.png from ${path.relative(path.dirname(notePath), peeled.src) || path.basename(peeled.src)}`);
  }
  upsertHub(slug, title, dateLabel);

  console.log(`wrote public/writes/${slug}/`);
  console.log(`url    https://www.nitishchauhan.com/writes/${slug}/`);

  if (args.push) {
    gitPushWrites(slug, title);
    return;
  }

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
