---
name: writes-publish
description: Publishes a markdown or Obsidian note to nitishchauhan.com/writes via the portfolio CLI. Use when the user says publish to writes, ship this note, post this essay on the main domain, or one-step Writes deploy.
---

# Writes publish

Run the CLI. Do not hand-copy HTML. Do not publish to Library unless the user explicitly asks. Do not change homepage OG.

## Command

```bash
cd ~/nitish-portfolio
npm run writes:publish -- "/absolute/path/to/note.md"
```

Optional flags:

- `--slug my-slug` if the title would make a bad URL
- `--kicker "short line"` for the OG card (empty is fine)
- `--force` overwrite an existing slug
- `--no-deploy` write files only (no rsync)

The CLI writes `public/writes/<slug>/index.html` + `og.json`, updates the hub list, then `npm run deploy` (OG PNG + VPS).

Live URL: `https://www.nitishchauhan.com/writes/<slug>/`

## Do not

- Invent an Obsidian plugin
- Point Writes `og:image` at `/og-image.png`
- Stall or restyle Library as part of this
- Touch `~/Pre-July 2026` except reading a note the user named
