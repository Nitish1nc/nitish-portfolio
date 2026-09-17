# NitishLabs - Recurring Themes Memo

Short handoff for agents wiring `labs/` content. Grounded in `~/Desktop/NitishLabs` plus the Downloads verbal / learning / UI notes. Brand: **NitishLabs**. Person: **Nitish Chauhan**.

## Strongest recurring themes

- **Cognitive leakage vs closed loops** - Massive insight generation; weak return path. NitishLife exists to stop leakage (index + protocol, not a second archive).
- **Output > execution capacity** - Explicit core problem in Context start-here. Packaging, distribution, and booking are the scarce resources - not ideas.
- **Exploration-first / compile-later** - Untamed exploration produces volume; agents and Cursor handle split/compile. Forcing organization before production is explicitly paused.
- **Named frameworks as reusable levers** - Signature pipeline, mechanism-first explainers, capture-first-decode-later, R&D vs shipping, encoding ≠ understanding, flow-friction surgery.
- **Verbal systems vocabulary** - Four clusters (Architecture / Dynamics / Epistemology / Teleology) + denser verbal cluster maps; language as diagnostic instrumentation.
- **Human Systems Strategist identity** - Coaching/mentorship for high performers; voice/video primary; not corporate consulting theatre or fluff life-coaching.
- **Mood-state as system state** - Fluency, practice, and identity must survive episode wipeouts (warm engine, mood-resilient protocols, identity ≠ fluency).
- **Low-energy / regulation-aware protocols** - Capture packets under load; decode when capacity returns. ADHD + bipolar treated as design constraints, not moral failures.
- **Chat → artifact pipeline** - Dense wiki-style synthesis, visual-spatial mapping (Obsidian/canvas), infographic/process maps over tip lists.
- **Visual Wiki Maps on every post** - Mandatory LinkedIn-style compressed carousel (skill: `visual-wiki-maps`). Auto via `scripts/labs-inbox/` from Downloads → Nextcloud → `/ideas`.
- **Self-hosted agent stack curiosity** - Hermes WebUI / CLI parity, memory files, subagents, Tailscale remote access (see Downloads UI notes); lab as living systems playground.
- **Tool capability vs process courses** - Feature/affordance mapping + multi-process sampling beats single-workflow tutorials and Reddit lock-in.
- **Integrity / boundaries as systems** - High-level: commitment checks, values, walking away from boundary violations - distinct from attraction/relational skill stacks.

## Folder signals (Desktop/NitishLabs)

| Area | Signal |
|------|--------|
| `NitishLife/` | Canonical frameworks, ingest protocol, memory briefs |
| `Context/` | Session resume, living handoff, "attach START_HERE" |
| `Cognitive-OS-Checkpoint/` | Voice-first pivot, coaching positioning, honest status notes |
| `1) active-projects/` | Memory/chat capture extensions - tooling for the loop |
| `ProjectDump/` | Import bay for new projects |
| `Portfolio AI Chats/` | Raw export mass (prefer briefs/frameworks over dumping) |

## Voice for site copy

First person, on Nitish Chauhan’s behalf. Sharp systems thinker talking to a peer - lightly humorous, concrete, mechanism > motivation. Prefer process maps to tip lists. Never shorten the name to "Nitish" alone as the brand on the public site (nav/hero/about); first-person “I” is fine in body copy.

Site top-of-page context (index + ideas) should briefly cover: what NitishLabs / this stream is, how to read it, and who Nitish Chauhan is (Human Systems Strategist; cognitive output > execution capacity; exploration-first).

## Visual system (CSS)

Shared file: `labs/assets/labs.css`. Documented variables:

| Token | Role |
|-------|------|
| `--labs-violet` / `--labs-violet-deep` | Primary brand accent |
| `--labs-indigo` | Mid stop in brand gradient |
| `--labs-cyan` / `--labs-cyan-deep` | Secondary accent (shifts off fuchsia-only) |
| `--labs-grad-brand` | Logo / brand mark |
| `--labs-grad-soft` | Context cards |
| `--labs-grad-cover-fallback` | Empty cover placeholder |
| `--labs-cover-ratio` | `16 / 9` for list + post covers |

Preserve zinc glass aesthetic; refine accents rather than redesign.

## Post cover convention (for Visual Wiki Map agents)

Every post should ship a dedicated **cover** plus the carousel slides.

| | |
|--|--|
| **Path** | `labs/posts/<slug>/carousel/cover.svg` (preferred) or `cover.png` |
| **Size** | **1600×900** (16:9). Cards and post heroes use `object-fit: cover`. |
| **Fallback** | If cover is missing, UI loads `slide-01.svg` (portrait title slide). |
| **HTML hook** | `<figure class="post-cover" data-labs-cover="<slug>/carousel">` on post pages; cards use `data-labs-cover="posts/<slug>/carousel"` via `labs/assets/covers.js`. |
| **JSON** | Optional `cover` on `posts.json` / `ideas-stream.json` entries (site-root path). |
| **Colors** | Match Labs accents: violet `#8b5cf6` / deep `#7c3aed`, indigo `#6366f1`, cyan `#22d3ee` on zinc `#09090b` - or a light wiki-map palette that still pairs with the dark shell. |

Carousel slides stay **1080×1350** (4:5) under the same `carousel/` folder (`slide-01.svg` …). Covers are landscape; slides are portrait.

## Do not invent

Prefer excerpts and named models already in `frameworks.md`, checkpoints, and the Downloads verbal/learning files. Personal relationship detail stays high-level mental-model framing only.
