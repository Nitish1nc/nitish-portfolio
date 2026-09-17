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
# or git-push (GitHub Actions deploys):
npm run writes:share -- "/absolute/path/to/note.md"
```

Rule: the first image in the markdown file is the share preview (`og.png`). The rest of the file is the article. Title is frontmatter `title`, else the first `# heading`, else the filename.

Optional flags:

- `--slug my-slug` if the title would make a bad URL
- `--kicker "short line"` for the OG card (empty is fine)
- `--force` overwrite an existing slug
- `--push` commit Writes files and `git push` (use this from Raycast)
- `--no-deploy` write files only (no rsync)

Raycast: copy `scripts/writes-share.sh` into Raycast Script Commands. Pass the active markdown file path as argument 1.

The CLI writes `public/writes/<slug>/index.html`, copies the first image to `og.png`, updates the hub list, then either `--push` or local `npm run deploy`.

Live URL: `https://www.nitishchauhan.com/writes/<slug>/`

## Do not

- Invent an Obsidian-only plugin (Raycast + this CLI covers any app)
- Point Writes `og:image` at `/og-image.png`
- Stall or restyle Library as part of this
- Touch `~/Pre-July 2026` except reading a note the user named
