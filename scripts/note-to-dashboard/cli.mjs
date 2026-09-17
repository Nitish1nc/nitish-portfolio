#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffold } from "./lib/scaffold.mjs";
import { verify } from "./lib/verify.mjs";
import {
  ROOT,
  loadDashboard,
  validateDashboard,
  lintDashes,
} from "./lib/validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../..");

function usage() {
  console.log(`note-to-dashboard — scaffold interactive pages from DashboardSchema JSON

Usage:
  node scripts/note-to-dashboard/cli.mjs validate <schema.json>
  node scripts/note-to-dashboard/cli.mjs scaffold <schema.json> [--target labs|portfolio] [--force]
  node scripts/note-to-dashboard/cli.mjs verify --schema <schema.json>
  node scripts/note-to-dashboard/cli.mjs verify --slug <slug> [--host labs|portfolio]

Fixtures:
  scripts/note-to-dashboard/fixtures/*.json

LLM extract/classify is not in v1. Hand-author or generate schema JSON, then scaffold.
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") args.force = true;
    else if (a === "--target" || a === "--host") args.target = argv[++i];
    else if (a === "--schema") args.schema = argv[++i];
    else if (a === "--slug") args.slug = argv[++i];
    else if (a === "--dir") args.dir = argv[++i];
    else if (a.startsWith("-")) {
      console.error("Unknown flag:", a);
      process.exit(2);
    } else args._.push(a);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") {
    usage();
    process.exit(0);
  }

  if (cmd === "validate") {
    const file = args._[1] || args.schema;
    if (!file) {
      console.error("validate requires a schema path");
      process.exit(2);
    }
    const doc = loadDashboard(path.resolve(file));
    const errors = validateDashboard(doc);
    const dashes = lintDashes(doc);
    if (errors.length || dashes.length) {
      errors.forEach((e) => console.error("ERR", e));
      dashes.forEach((d) => console.error("DASH", d));
      process.exit(1);
    }
    console.log("OK", doc.slug, doc.archetype);
    return;
  }

  if (cmd === "scaffold") {
    const file = args._[1] || args.schema;
    if (!file) {
      console.error("scaffold requires a schema path");
      process.exit(2);
    }
    try {
      const result = scaffold({
        schemaPath: path.resolve(file),
        target: args.target,
        force: !!args.force,
      });
      console.log(
        JSON.stringify(
          {
            ok: true,
            ...result,
          },
          null,
          2
        )
      );
    } catch (e) {
      console.error(e.message || e);
      process.exit(1);
    }
    return;
  }

  if (cmd === "verify") {
    let dir = args.dir;
    if (args.slug) {
      const host = args.target || "portfolio";
      dir =
        host === "labs"
          ? path.join(REPO, "labs", args.slug)
          : path.join(REPO, "public", args.slug);
    }
    const report = verify({
      schemaPath: args.schema ? path.resolve(args.schema) : undefined,
      dir,
    });
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }

  console.error("Unknown command:", cmd);
  usage();
  process.exit(2);
}

main();
