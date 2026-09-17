#!/usr/bin/env node
/**
 * Render public/writes/<slug>/og.png from each slug's og.json + public/writes/_og.html.
 * Missing Playwright (package or Chromium) warns and exits 0 so parent deploy can continue.
 */
import { existsSync, globSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITES_DIR = path.join(ROOT, "public", "writes");
const TEMPLATE_PATH = path.join(WRITES_DIR, "_og.html");
const VIEWPORT = { width: 1200, height: 630 };

function rel(p) {
  return path.relative(ROOT, p) || p;
}

function isSlugDir(name) {
  if (!name || name === "_og.html" || name.startsWith("_") || name.startsWith(".")) {
    return false;
  }
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(name);
}

function findOgJsonFiles() {
  const matches = globSync("*/og.json", { cwd: WRITES_DIR });
  const files = [];
  for (const match of matches) {
    const slug = match.split(/[\\/]/)[0];
    if (!isSlugDir(slug)) continue;
    files.push({
      slug,
      jsonPath: path.join(WRITES_DIR, match),
      pngPath: path.join(WRITES_DIR, slug, "og.png"),
    });
  }
  files.sort((a, b) => a.slug.localeCompare(b.slug));
  return files;
}

function isUpToDate(pngPath, jsonPath, templatePath) {
  if (!existsSync(pngPath)) return false;
  const pngMtime = statSync(pngPath).mtimeMs;
  return pngMtime > statSync(jsonPath).mtimeMs && pngMtime > statSync(templatePath).mtimeMs;
}

function isMissingPlaywright(err) {
  const s = String(err?.message || err);
  const code = err?.code;
  return (
    code === "ERR_MODULE_NOT_FOUND" ||
    /Cannot find package ['"]playwright['"]/i.test(s) ||
    /Cannot find module ['"]playwright['"]/i.test(s)
  );
}

function isMissingChromium(err) {
  const s = String(err?.message || err);
  return /Executable doesn't exist|browserType\.launch|Looks like Playwright was just installed|npx playwright install/i.test(
    s,
  );
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (err) {
    if (isMissingPlaywright(err)) {
      console.warn(
        "writes:og skipped: playwright is not installed. Run `npm install -D playwright` then `npx playwright install chromium`.",
      );
      process.exit(0);
    }
    throw err;
  }
}

async function injectCard(page, { title, kicker }) {
  await page.evaluate(({ title, kicker }) => {
    const titleEl = document.querySelector("#og-title");
    if (titleEl) titleEl.textContent = title;

    const kickerEl = document.querySelector("#og-kicker");
    if (!kickerEl) return;
    if (!kicker) {
      kickerEl.textContent = "";
      kickerEl.hidden = true;
      kickerEl.style.display = "none";
    } else {
      kickerEl.hidden = false;
      kickerEl.style.removeProperty("display");
      kickerEl.textContent = kicker;
    }
  }, { title, kicker });
}

async function waitForPaint(page) {
  await page.evaluate(() => document.fonts.ready);
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    // file:// + webfonts may never go fully idle
  }
  await new Promise((r) => setTimeout(r, 300));
}

async function main() {
  const { chromium } = await loadPlaywright();
  const jobs = findOgJsonFiles();

  if (jobs.length === 0) {
    console.log("writes:og: no public/writes/<slug>/og.json files found");
    return;
  }

  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`writes:og: missing template ${rel(TEMPLATE_PATH)}`);
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    if (isMissingChromium(err)) {
      console.warn(
        "writes:og skipped: Playwright Chromium is not installed. Run `npx playwright install chromium`.",
      );
      process.exit(0);
    }
    throw err;
  }

  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  const templateUrl = pathToFileURL(TEMPLATE_PATH).href;
  let failures = 0;

  try {
    await page.goto(templateUrl, { waitUntil: "load", timeout: 30000 });

    for (const job of jobs) {
      let data;
      try {
        data = JSON.parse(await readFile(job.jsonPath, "utf8"));
      } catch (err) {
        console.error(`writes:og: ${job.slug}: invalid og.json (${err.message})`);
        failures += 1;
        continue;
      }

      const title = typeof data.title === "string" ? data.title.trim() : "";
      const kicker = typeof data.kicker === "string" ? data.kicker.trim() : "";
      if (!title) {
        console.error(`writes:og: ${job.slug}: og.json is missing title`);
        failures += 1;
        continue;
      }

      if (isUpToDate(job.pngPath, job.jsonPath, TEMPLATE_PATH)) {
        console.log(`writes:og: skip ${job.slug} (og.png newer than og.json and _og.html)`);
        continue;
      }

      await injectCard(page, { title, kicker });
      await waitForPaint(page);
      await page.screenshot({
        path: job.pngPath,
        type: "png",
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      });
      console.log(`writes:og: wrote ${rel(job.pngPath)}`);
    }
  } finally {
    await browser.close();
  }

  if (failures) process.exit(1);
}

main().catch((err) => {
  if (isMissingPlaywright(err)) {
    console.warn(
      "writes:og skipped: playwright is not installed. Run `npm install -D playwright` then `npx playwright install chromium`.",
    );
    process.exit(0);
  }
  if (isMissingChromium(err)) {
    console.warn(
      "writes:og skipped: Playwright Chromium is not installed. Run `npx playwright install chromium`.",
    );
    process.exit(0);
  }
  console.error("writes:og failed:", err);
  process.exit(1);
});
