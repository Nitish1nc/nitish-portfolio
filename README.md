# Nitish Chauhan Portfolio

Vite, React, TypeScript, and Tailwind CSS portfolio deployed to a VPS behind nginx.

## Local development

```bash
npm install
npm run dev
```

Build and preview production output:

```bash
npm run build
npm run preview
```

## Deployment

The local workspace is the source of truth. Do not develop from the Nextcloud File Provider copy because syncing `node_modules` causes reliability issues.

Requirements:

- SSH key access to `root@187.127.218.198` (live host behind public DNS)
- `rsync`, `ssh`, Node.js, and npm

Deploy:

```bash
npm run deploy
```

The script builds locally, synchronizes `dist/` to `/opt/nitish-portfolio/dist/`, validates nginx, and reloads it.

Override the target when needed:

```bash
VPS_HOST=user@example.com VPS_DIST=/srv/site/dist/ npm run deploy
```

## Adding an artifact to the homepage

The homepage registry is content-driven. Adding or editing an artifact needs no code changes:

1. Create `content/artifacts/<slug>.md`:

```yaml
---
title: "Artifact Name"
oneLiner: "One sentence, zero context needed."
url: https://labs.nitishchauhan.com/thing/   # omit if not public yet
tags: [ai-systems, visuals]                  # ids from content/tags.json
status: live                                 # live | prototype | in-progress | planned
featured: true                               # optional, shows in the top row
order: 40                                    # lower sorts first
cover: /artifacts/<slug>/cover.png           # optional 16:9 image in public/artifacts/
date: 2026-08-26
---
A short paragraph, shown on featured cards.
```

Quote `title` and `oneLiner` whenever they contain a colon.

2. Optionally drop a 16:9 cover (screenshot or Visual Wiki Map cover) at `public/artifacts/<slug>/cover.png`. Cards without a cover get a designed fallback tile.
3. Run `npm run deploy`.

Tag labels live in `content/tags.json`. Status badges: live (green), prototype (blue), in progress (amber), planned (gray).

### Nitish Labs

Static experiments site at <https://labs.nitishchauhan.com> (source: `labs/`). Deploy separately:

```bash
npm run deploy:labs
```

That rsyncs `labs/` to `/opt/nitish-labs/` on the VPS, then validates and reloads nginx.

## Service map

- Portfolio: <https://www.nitishchauhan.com> and <https://nitishchauhan.com>
- Nitish Labs: <https://labs.nitishchauhan.com>
- Nextcloud: <https://cloud.nitishchauhan.com>
- Hermes WebUI: <https://chat.nitishchauhan.com>
- Live portfolio path: `/opt/nitish-portfolio/dist/`
- Live labs path: `/opt/nitish-labs/`
- Hermes home: `/root/.hermes`

## Hermes WebUI (mobile / PWA)

Primary mobile access is the Hermes WebUI at <https://chat.nitishchauhan.com> (loopback service on the VPS, nginx + HTTPS). Telegram remains the backup channel.

On Android Chrome:

1. Open <https://chat.nitishchauhan.com>
2. Sign in with the WebUI password (and passkey if enabled)
3. Menu → **Add to Home screen** / Install app
4. Confirm chat works; Telegram stays available as backup

If the PWA is not enough later, see fallbacks in `BUCKETLIST.md` (Hermes Android APK, or Open WebUI + Conduit).

## Operations

Run the read-only VPS health check:

```bash
npm run vps:check
```

Reference nginx configurations are stored in `ops/nginx/`, and the Hermes WebUI service definition is stored in `ops/systemd/`. The VPS files remain authoritative; refresh the reference copies after infrastructure changes.

Deferred ideas are tracked in `BUCKETLIST.md`.
