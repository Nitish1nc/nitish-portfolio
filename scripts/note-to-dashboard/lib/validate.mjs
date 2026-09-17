import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT, "schema", "dashboard.schema.json");

const DASH_RE = /[\u2014\u2013]/g;

export function loadSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
}

export function loadDashboard(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

/** Lightweight validator matching dashboard.schema.json required rules. */
export function validateDashboard(doc) {
  const errors = [];
  const req = [
    "schemaVersion",
    "archetype",
    "slug",
    "title",
    "excerpt",
    "date",
    "author",
    "category",
    "host",
    "hook",
  ];
  for (const key of req) {
    if (doc[key] === undefined || doc[key] === null || doc[key] === "") {
      errors.push(`missing required field: ${key}`);
    }
  }
  if (doc.schemaVersion && doc.schemaVersion !== "1.0.0") {
    errors.push(`schemaVersion must be 1.0.0, got ${doc.schemaVersion}`);
  }
  const archetypes = [
    "stepper-lab",
    "scroll-explainer",
    "ideas-essay",
    "contrast-toggle",
    "map-first",
  ];
  if (doc.archetype && !archetypes.includes(doc.archetype)) {
    errors.push(`invalid archetype: ${doc.archetype}`);
  }
  if (doc.author && doc.author !== "Nitish Chauhan") {
    errors.push('author must be "Nitish Chauhan"');
  }
  if (doc.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug)) {
    errors.push(`invalid slug: ${doc.slug}`);
  }
  if (doc.date && !/^\d{4}-\d{2}-\d{2}$/.test(doc.date)) {
    errors.push(`invalid date: ${doc.date}`);
  }
  if (doc.archetype === "stepper-lab") {
    if (!Array.isArray(doc.modules) || doc.modules.length < 1) {
      errors.push("stepper-lab requires modules[1..6]");
    } else if (doc.modules.length > 6) {
      errors.push("stepper-lab supports at most 6 modules");
    }
  }
  if (doc.archetype === "scroll-explainer") {
    if (!Array.isArray(doc.sections) || doc.sections.length < 1) {
      errors.push("scroll-explainer requires sections[]");
    }
  }
  if (doc.archetype === "contrast-toggle" && !doc.contrast) {
    errors.push("contrast-toggle requires contrast");
  }
  if (Array.isArray(doc.modules)) {
    doc.modules.forEach((m, i) => {
      for (const k of [
        "id",
        "num",
        "scienceName",
        "plainName",
        "intro",
        "whatToDo",
        "writerRule",
        "widgets",
      ]) {
        if (!m[k]) errors.push(`modules[${i}] missing ${k}`);
      }
      if (m.widgets && !Array.isArray(m.widgets)) {
        errors.push(`modules[${i}].widgets must be an array`);
      }
    });
  }
  return errors;
}

export function collectCopyStrings(doc, out = []) {
  const push = (v) => {
    if (typeof v === "string" && v.trim()) out.push(v);
  };
  push(doc.title);
  push(doc.eyebrow);
  push(doc.hook);
  push(doc.excerpt);
  push(doc.howThisWorks);
  push(doc.takeaway);
  push(doc.takeawayTitle);
  push(doc.caveat);
  push(doc.ogAlt);
  (doc.lede || []).forEach(push);
  (doc.terms || []).forEach(push);
  if (doc.contrast) {
    push(doc.contrast.left?.label);
    push(doc.contrast.left?.body);
    push(doc.contrast.right?.label);
    push(doc.contrast.right?.body);
  }
  (doc.modules || []).forEach((m) => {
    push(m.scienceName);
    push(m.plainName);
    push(m.intro);
    push(m.whatToDo);
    push(m.writerRule);
    push(m.soFar);
  });
  (doc.sections || []).forEach((s) => {
    push(s.heading);
    push(s.body);
  });
  (doc.foundations || []).forEach((f) => {
    push(f.title);
    push(f.cite);
    push(f.body);
  });
  return out;
}

export function lintDashes(doc) {
  const hits = [];
  collectCopyStrings(doc).forEach((s) => {
    if (DASH_RE.test(s)) {
      hits.push(s.slice(0, 80));
    }
  });
  return hits;
}

export { ROOT, SCHEMA_PATH };
