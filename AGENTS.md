# Publishing

This file is the contract for coding agents working in `Nitish1nc/nitish-portfolio`. The live layout and `.github/workflows/deploy.yml` are authoritative. Do not add a deploy API, webhook, database, or second publishing service.

## Destinations

| What | Where in this repo | Live URL |
|---|---|---|
| Homepage artifact | `content/artifacts/<slug>.md` | Card on `https://nitishchauhan.com` |
| Optional cover | `public/artifacts/<slug>/` (png or svg; set `cover:` to that public path) | Served from the portfolio build |
| Standalone Labs page | `labs/` (a folder with `index.html`, or an HTML file already used by the Labs index) | `https://labs.nitishchauhan.com/` |

Homepage frontmatter:

```yaml
---
title: "Artifact Name"
oneLiner: "One sentence, zero context needed."
url: https://labs.nitishchauhan.com/thing/
tags: [ai-systems, visuals]
status: live
featured: true
order: 40
cover: /artifacts/<slug>/cover.png
date: 2026-08-26
---
```

`status` is `live`, `prototype`, `in-progress`, or `planned`. Quote `title` and `oneLiner` when they contain a colon. Tag ids come from `content/tags.json`. Omit `url` when the page is not public yet.

## Deploy

Commit to `master` and push. GitHub Actions (`.github/workflows/deploy.yml`) checks out the repo, builds, and publishes over SSH:

- `dist/` → `/opt/nitish-portfolio/dist/` (`nitishchauhan.com`)
- `labs/` → `/opt/nitish-labs/` (`labs.nitishchauhan.com`)

Pushes to `main` and a manual `workflow_dispatch` run the same workflow. After rsync it runs `nginx -t` and reloads nginx. Secrets: `SSH_PRIVATE_KEY` (required), `VPS_HOST` (optional; default `root@187.127.218.198`).

## `rsync --delete`

Both syncs use `rsync --delete`. A file removed from the built `dist/` or from `labs/` is removed on the VPS. Do not delete or rename unrelated files, directories, or artifact entries. A docs-only commit still runs the full deploy; the build must succeed or the job stops before rsync.

## Before and after a publish

1. Diff only the files for this change. Confirm nothing unrelated is deleted.
2. Run the build when the change touches site source (`npm run build`, and `npm run deploy:labs` inputs when Labs CSS or nested apps change). A markdown-only contract file does not change `dist/` or `labs/`.
3. Push to `master`.
4. Confirm the Actions run for that commit succeeded before telling the user it is live.

## Outside this pipeline

`/topics/` (`/opt/nitish-topics/`), `/p/` (`/opt/nitish-drops/`), and `/context-wheel/` (`/opt/context-wheel/`) are not in this repo and are not updated by this workflow. Do not claim a push published them.

## Do not change

Leave `.github/workflows/deploy.yml`, nginx config, and existing pages in place unless the task is specifically to edit one of those. Do not add dependencies or infrastructure for publishing.
