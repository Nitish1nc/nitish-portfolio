# NitishLabs Downloads Inbox - Candidate Conditions

> **Status (2026-07-22): PAUSED** pending Nitish Chauhan review. 
> Do not run `npm run labs:watch:install` until filters + titles look right. 
> Launchd agent should stay unloaded. Manual one-offs: `npm run labs:publish -- /path`.

A Downloads file is treated as a Labs candidate when **all** of the following hold.

## Hard gates

1. File finished writing (size stable ≥ 5s; no `.crdownload` / `.download` / `.part` / `.tmp`).
2. Extension in allowlist:
 - Documents: `.pdf` `.md` `.txt` `.markdown` `.html` `.htm` `.docx` `.rtf`
 - Chat exports: `.json` (ChatGPT/Grok/Claude/Cursor-style)
 - Visuals: `.png` `.jpg` `.jpeg` `.webp` `.svg`
3. Size between 2 KB and 40 MB (images min 15 KB).
4. Not already processed (content hash in `~/.local/share/nitish-labs-inbox/seen.json`).
5. **mtime watermark** - file `mtime` must be **≥** `seen.json.minMtimeMs`. 
 On (re)enable, watermark is set to *now* so historical Downloads are **never** backfilled.
6. Not excluded by name: `Screenshot`, `IMG_`, `Photo`, `WhatsApp`, `Screen Recording`,
 `.DS_Store`, `desktop.ini`, `GoogleSearch*`, `Investigation Report*`, `Questions Only*`.

## Soft signals (need ≥ 1) - kept narrow on purpose

Filename or extracted text (first ~8 KB) matches any of:

- Brand / project: `NitishLabs`, `Nitish Labs`, `nitishchauhan`, `Cognitive-OS`, `NitishLife`
- Visual Wiki / compression: `visual wiki`, `wiki map`, `compressed visual`, `pinterest-style`,
 `pinterest-visual`, `environmental design`
- Named Labs themes: `speech-first`, `capability vs/versus/learning/map`, `process vs capability`,
 `zero-upfront`, `closed-loop`, `capture first, decode`
- Hermes architecture pairings: `hermes` + (`openweb` | `middleware` | `webui`)
- Chat export + Labs topic: `(ChatGPT|Grok|Claude|Gemini)-…(menu|framework|pipeline|hierarchy|labs)`

Images additionally qualify if the filename contains `visual`, `wiki`, `map`, `schema`,
`pipeline`, `hierarchy`, `infographic`, or `pinterest`.

## Pipeline after accept

1. Copy into Nextcloud `NitishLabs/Inbox/<date>/<slug>/` (source + metadata).
2. Extract text → draft Labs post under `labs/posts/<slug>.html`.
3. Generate mandatory Visual Wiki Map LinkedIn carousel (SVG slides).
4. Prepend `labs/content/posts.json` + `labs/content/ideas-stream.json`.
5. `npm run deploy:labs` (rsync + nginx reload).
6. Copy Nextcloud inbox folder to `NitishLabs/Published/<date>/<slug>/`.
7. Notify (macOS Notification Center; Telegram if configured).

## Pause / re-enable

```bash
# Pause (unload launchd + mark paused)
bash scripts/labs-inbox/pause-watcher.sh

# After review - sets fresh mtime watermark, then installs launchd
npm run labs:watch:install
```

## Manual override

```bash
npm run labs:publish -- /path/to/file
```

Skips soft-signal checks and pause gate; still applies hard gates (except watermark) and carousel requirement.
