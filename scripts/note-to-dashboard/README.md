# note-to-dashboard

Local template-based scaffolder: **DashboardSchema JSON → deployable interactive page**.

Sibling of [canvas-to-labs/PLAYBOOK.md](../canvas-to-labs/PLAYBOOK.md). This tool is deterministic (validate / scaffold / verify). LLM **classify** and **extract** come later.

## Quick start

```bash
# Validate a fixture
npm run n2d -- validate scripts/note-to-dashboard/fixtures/clause-syntax.json

# Scaffold to public/<slug>/ (portfolio)
npm run n2d -- scaffold scripts/note-to-dashboard/fixtures/vs-contrast.json --target portfolio --force

# Scaffold to labs/<slug>/
npm run n2d -- scaffold scripts/note-to-dashboard/fixtures/pipeline-protocol.json --target labs --force

# Verify an output folder
npm run n2d -- verify --slug tool-vs-thought --host portfolio
```

## Layout

| Path | Role |
|------|------|
| `schema/dashboard.schema.json` | Contract (v1.0.0) |
| `fixtures/` | Golden examples (mechanism, protocol, vs, thin) |
| `runtime/app.js` | Data-driven widgets (reads `#dashboard-data`) |
| `runtime/page.css` | Shared chrome (from clause-syntax) |
| `lib/` | validate, scaffold, verify |
| `cli.mjs` | CLI entry |

## Archetypes in v1

- `stepper-lab` — multi-module interactive (clause-syntax)
- `contrast-toggle` — one-module A/B style
- `scroll-explainer` — static sections + optional widgets

Not yet: `ideas-essay`, `map-first` (use labs-inbox / visual-wiki-maps).

## House rules enforced

- Author must be `Nitish Chauhan`
- No em dashes or en dashes in copy fields
- Slug kebab-case
- sessionStorage key is `n2d-<slug>` (not a hard-coded inner-voice key)

## Deploy

Scaffold only. When ready:

- Portfolio: `npm run deploy` (ensure nginx `location /<slug>/` if needed)
- Labs: `npm run deploy:labs` (shell.js EXPERIMENT_DIRS patched when scaffolding to labs)
