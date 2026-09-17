# Canvas to Labs publish playbook

Mechanical checklist for porting a Cursor Canvas (`.canvas.tsx`) into a Nitish Labs interactive experiment. An agent or script can follow these steps in order.

**Reference contract (locked for `inner-voice/`):**

| Field | Value |
|-------|-------|
| Title | Why Some Writing Sounds Like Talking |
| Slug | `inner-voice/` |
| Live URL | https://labs.nitishchauhan.com/inner-voice/ |
| Source canvas | `/Users/nitishchauhan/.cursor/projects/Users-nitishchauhan-nitish-portfolio/canvases/prosodic-cognitive-simulation.canvas.tsx` |
| Live files | `labs/inner-voice/index.html`, `app.js`, `og.svg` |
| Registries | `posts.json`, `ideas-stream.json`, `experiments.json`, `projects.json` |
| Shell fix | `labs/assets/shell.js` `rootPrefix()` for `/inner-voice/` |
| Deploy (later) | `npm run deploy:labs` |

---

## 1. Inputs

Collect before any file writes:

| Input | Required | Example (`inner-voice`) |
|-------|----------|-------------------------|
| `canvasPath` | yes | `.../canvases/prosodic-cognitive-simulation.canvas.tsx` |
| `slug` | yes | `inner-voice/` (trailing slash in docs; folder is `labs/inner-voice/`) |
| `title` | yes | Why Some Writing Sounds Like Talking |
| `scienceLabel` | optional | Prosodic Cognitive Simulation (small label only, not H1) |
| `hook` | yes | One zero-context sentence: why open this page |
| `category` | yes | `Experiments` |
| `date` | yes | `2026-09-08` (ISO for registries; human date for ideas-stream) |
| `author` | yes | Nitish Chauhan |
| `labs` | yes | Ordered list of interactive modules to port (ids, science names, everyday names) |
| `liveUrl` | yes | `https://labs.nitishchauhan.com/inner-voice/` |

**Abort if:** slug collides with an existing `labs/<slug>/` folder unless explicitly replacing.

---

## 2. Port rules (canvas to vanilla Labs)

### Strip

- Remove all `cursor/canvas` imports (`useCanvasState`, `useHostTheme`, `Button`, `Card`, etc.).
- No React, no build step, no npm packages in the shipped folder.
- No `fetch()` or network calls in `app.js`.

### Keep

- All interactive behavior from the source canvas (toggles, steppers, bars, pick-one continuations).
- Data arrays (clauses, breath chains, closure steps, predict tracks) as plain JS constants in `app.js`.
- One-lab-at-a time navigation if the canvas uses it.

### Wire Labs shell in `index.html`

Mirror post templates (`labs/posts/*.html`):

```html
<link rel="stylesheet" href="../assets/tailwind.css" />
<link rel="stylesheet" href="../assets/labs.css" />
<div data-labs-nav data-labs-variant="article" data-labs-active="Experiments"></div>
<!-- page content -->
<div data-labs-footer></div>
<script src="../assets/shell.js"></script>
<script src="app.js"></script>
```

- Favicon: `../favicon.svg`, `../apple-touch-icon.png`
- `theme-color`: `#09090b`
- Canonical, `og:url`, `og:image`, Twitter card all point at `https://labs.nitishchauhan.com/<slug>/` and `.../og.svg`
- `og:image` dimensions: **1200 x 630**

### `app.js` structure

- IIFE or `DOMContentLoaded` entry
- `useCanvasState(key, default)` becomes module-local state + `render()` or targeted DOM updates
- Inline SVG for simple visuals (buffer bar, breath line, arc track) copied from canvas JSX, with stroke/fill from CSS variables or zinc/violet classes
- Class names from `labs.css` / Tailwind utilities already on the site (glass, zinc text, violet accent sparingly)

---

## 3. Isolation and UX requirements

These apply to every canvas port pushed live:

| Requirement | Implementation |
|-------------|----------------|
| Hero contrast | Playful plain-English H1 (`title`), not jargon-first. Zero-context hook plus before/after contrast in hero. |
| One lab at a time | Show numbered lab 01-04 only; hide others. Pills as map; Previous / Next. |
| What to do | First line of each lab, adjacent to controls: "What to do: ..." |
| Everyday names | Under science names: e.g. The reset / The breath / The held thought / The next-word pull |
| Writer rule | After each lab: one line "So on the page, do X" |
| Next button | Label with next lab name, not generic "Next" |
| Takeaway | Full synthesis only after lab 04 |
| Onboarding | Short "How this page works" block: 4 labs, flip a control, then Next |
| Caveat | Demo sentences are illustrative, not empirical stimuli |
| Mobile | Stack nav, large hit targets, readable type on narrow viewports |

---

## 4. House rules

- **Name:** Nitish Chauhan in byline, footer, and registry author fields.
- **Dashes:** Never em dash or en dash in copy. Use commas, colons, periods, or spaced hyphen (` - `).
- **Voice:** Conversational NitishLabs tone, light humor, numbered sections, visible controls with instructions.
- **OG image:** `og.svg` (or PNG) at 1200x630, simple geometric, no emojis.
- **Accent:** Zinc glass look from `labs.css`; violet sparingly. No rainbow UI.
- **Shell `rootPrefix`:** Nested experiment dirs must resolve `../` for nav and assets. See step 6.

---

## 5. Registry JSON shapes (prepend / top entry)

Add one entry to each file below. Prepend so the new experiment surfaces first.

### `labs/content/posts.json`

```json
{
  "slug": "inner-voice",
  "title": "Why Some Writing Sounds Like Talking",
  "excerpt": "Four quick labs on why silent reading feels like someone talking in your head.",
  "category": "Experiments",
  "date": "2026-09-08",
  "href": "inner-voice/"
}
```

### `labs/content/ideas-stream.json`

```json
{
  "title": "Why Some Writing Sounds Like Talking",
  "excerpt": "Four quick labs on why silent reading feels like someone talking in your head.",
  "category": "Experiments",
  "date": "Sep 8",
  "group": "Experiments",
  "href": "inner-voice/"
}
```

### `labs/content/experiments.json`

```json
{
  "id": "inner-voice",
  "title": "Why Some Writing Sounds Like Talking",
  "status": "Active",
  "note": "Prosodic cognitive simulation in four interactive labs",
  "summary": "When you read, your brain runs a prosodic simulation of a living voice. Flip controls across buffer, breath, closure, and prediction.",
  "stack": ["vanilla JS", "Labs shell", "SVG"],
  "tags": ["reading", "prosody", "interactive", "cognitive-science"],
  "sourceFiles": [
    "canvases/prosodic-cognitive-simulation.canvas.tsx"
  ],
  "href": "inner-voice/"
}
```

### `labs/content/projects.json`

```json
{
  "id": "inner-voice",
  "slug": "inner-voice",
  "title": "Why Some Writing Sounds Like Talking",
  "subtitle": "Prosodic cognitive simulation",
  "status": "Active",
  "tagline": "Silent reading is not dictionary lookup. It is a voice simulation you can feel.",
  "summary": "Four numbered labs: working memory buffer, prosodic breath, delayed closure, predictive syntax. Built from a Cursor canvas, shipped as vanilla Labs.",
  "why": "Writers who understand the inner ear write prose that sounds spoken without sounding sloppy.",
  "stack": ["vanilla JS", "Labs shell"],
  "tags": ["reading", "prosody", "interactive"],
  "href": "inner-voice/",
  "sourceFiles": [
    "canvases/prosodic-cognitive-simulation.canvas.tsx"
  ]
}
```

---

## 6. File tree to create

```
labs/
  inner-voice/
    index.html      # shell, meta, hero, lab mount points, footer placeholders
    app.js          # all interactivity, no build
    og.svg          # 1200x630 share image
  assets/
    shell.js        # rootPrefix patch (see below)
  content/
    posts.json          # prepend entry
    ideas-stream.json   # prepend entry
    experiments.json    # prepend entry
    projects.json       # prepend entry
```

### `shell.js` `rootPrefix` patch

Current logic only returns `../` for `/posts/` and `/projects/`. One-segment experiment paths (`/inner-voice/`, `/reality-engine/`, `/atlas/`, `/metabolize/`) also need `../` so nav links and asset paths resolve to `labs/` root.

**Deterministic rule to add:** if pathname matches a single-segment directory under Labs root (not `index.html` at root), return `../`.

**Do not break:** home (`/`), `ideas.html`, `posts/*`, `projects/*`.

---

## 7. Verify

Run before deploy:

| Check | How |
|-------|-----|
| Desktop layout | Open `labs/inner-voice/index.html` via local static server (or spot-check markup) |
| Mobile stack | Narrow viewport: nav pills wrap, controls stack, tap targets >= 44px |
| All four labs | Toggle/step through 01-04; state resets appropriately on mode switch |
| Nav from nested folder | Home, Ideas, Experiments links go to `../index.html`, `../ideas.html`, not broken relative paths |
| OG tags | `og:url`, `og:image` use `labs.nitishchauhan.com` canonical host |
| Copy lint | No em/en dashes; Nitish Chauhan present |
| Registry parse | `node -e "JSON.parse(require('fs').readFileSync('labs/content/posts.json'))"` on all four files |

---

## 8. Deploy command

**Do not run during spec-only or sibling build runs.** When ready:

```bash
npm run deploy:labs
```

This executes `scripts/deploy-labs.sh`:

1. Optionally runs `npm run labs:css` if defined
2. `rsync -avz --delete labs/` to `root@187.127.218.198:/opt/nitish-labs/`
3. SSH: nginx config touch-up, `nginx -t`, `systemctl reload nginx`

Live site: https://labs.nitishchauhan.com/inner-voice/

---

## 9. Out of scope this run

| Item | When needed |
|------|-------------|
| Visual Wiki Map carousel | Optional for interactive experiments. **Required** if publishing as an ideas essay post under `labs/posts/`. |
| `npm run deploy` (portfolio) | Not used for Labs experiments |
| Building React/Vite bundles | Use only when the experiment already has a separate app build (e.g. `reality-engine/`). Canvas ports default to vanilla `app.js`. |
| Running deploy in automation doc pass | Spec and local files only unless explicitly asked |

---

## 10. Automation hooks

| Step | Deterministic | LLM or human judgment |
|------|---------------|----------------------|
| Read canvas path, list imports and state keys | yes | |
| Scaffold `index.html` from template | yes | |
| Copy shell/footer wiring | yes | |
| `rootPrefix` patch in `shell.js` | yes | |
| Registry JSON prepend | yes (with provided title, excerpt, date) | excerpt/hook wording |
| Port React components to vanilla DOM | partial | widget logic, SVG paths |
| Rewrite canvas copy for Labs voice | no | hook, writer rules, takeaway |
| Generate `og.svg` | partial | layout and metaphor |
| Hero before/after contrast | no | scene selection |
| Everyday lab names under science labels | no | |
| Verify accessibility labels | partial | aria text |
| Deploy | yes (script) | approval gate |

**Suggested script boundaries**

- `canvas-to-labs scaffold --slug inner-voice --title "..."` : folders, HTML template, registry stubs
- `canvas-to-labs port --canvas <path>` : LLM step with playbook sections 2-3 as system prompt
- `canvas-to-labs verify` : JSON parse, dash lint, required files exist
- Deploy remains manual or CI-gated: `npm run deploy:labs`

---

## Quick checklist (copy for agents)

```
[ ] 1. Inputs recorded (canvasPath, slug, title, hook, labs list)
[ ] 2. labs/<slug>/index.html + app.js + og.svg created
[ ] 3. UX: one lab at a time, what-to-do, writer rules, takeaway after 04
[ ] 4. House rules: Nitish Chauhan, no em/en dashes, OG 1200x630
[ ] 5. Four registries prepended
[ ] 6. shell.js rootPrefix handles /<slug>/
[ ] 7. Verified desktop/mobile + nav links
[ ] 8. Deploy deferred until explicit ask
```
