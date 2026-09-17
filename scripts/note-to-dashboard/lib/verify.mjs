import fs from "node:fs";
import path from "node:path";
import {
  loadDashboard,
  validateDashboard,
  lintDashes,
} from "./validate.mjs";

/**
 * @param {object} opts
 * @param {string} [opts.schemaPath]
 * @param {string} [opts.dir]
 */
export function verify({ schemaPath, dir }) {
  const report = { ok: true, errors: [], warnings: [] };

  let doc = null;
  if (schemaPath) {
    doc = loadDashboard(schemaPath);
  } else if (dir) {
    const dash = path.join(dir, "dashboard.json");
    if (!fs.existsSync(dash)) {
      report.ok = false;
      report.errors.push(`missing dashboard.json in ${dir}`);
      return report;
    }
    doc = loadDashboard(dash);
  } else {
    report.ok = false;
    report.errors.push("provide --schema or --slug/--dir");
    return report;
  }

  const verr = validateDashboard(doc);
  report.errors.push(...verr);
  const dashes = lintDashes(doc);
  if (dashes.length) {
    report.errors.push(
      "em/en dashes in copy: " + dashes.slice(0, 5).join(" | ")
    );
  }

  if (dir) {
    const required = ["index.html", "app.js", "page.css", "dashboard.json", "og.svg", "favicon.svg"];
    for (const f of required) {
      if (!fs.existsSync(path.join(dir, f))) {
        report.errors.push(`missing file: ${f}`);
      }
    }
    const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    if (!html.includes('id="dashboard-data"')) {
      report.errors.push("index.html missing #dashboard-data");
    }
    if (!html.includes("Nitish Chauhan")) {
      report.errors.push("index.html missing Nitish Chauhan byline");
    }
    if (doc.host === "portfolio" || dir.includes("/public/")) {
      if (!fs.existsSync(path.join(dir, "assets", "labs.css"))) {
        report.warnings.push("portfolio scaffold missing assets/labs.css");
      }
    }
  }

  report.ok = report.errors.length === 0;
  report.slug = doc.slug;
  report.archetype = doc.archetype;
  return report;
}
