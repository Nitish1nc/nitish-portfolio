# NitishLabs design-system punch list

Source: Site-Launch-Feedback.md + skim of `labs/index.html`, `labs/ideas.html`, `labs/assets/labs.css`, `labs/posts/build-the-kitchen-first.html`, `labs/posts/mirror-before-the-agent.html`.

North star (feedback): *"Reduce visual noise by 30%, increase perceived craftsmanship by 50%. Use whitespace, typography, motion, and consistency instead of extra effects."*

Scope: tiny, cohesive token/component fixes. Preserve dark zinc + violet accents, Space Grotesk + Inter, glass. Never introduce em dashes or en dashes in new copy (use commas, colons, periods, or spaced hyphen ` - `).

---

## Must-fix (tiny)

- [ ] `labs/assets/labs.css` `:root`: add spacing scale tokens `--labs-space-1` through `--labs-space-8` as `4/8/12/16/24/32/48/64px` (or rem equiv). Replace ad-hoc `mt-12`/`mt-14`/`mt-20`/`mt-24` section gaps on index/ideas with multiples of these (target ~+25% air: "If something feels fine, add another 8-16px").
- [ ] `labs/assets/labs.css` `:root`: add type tokens matching feedback hierarchy: `--labs-text-hero: clamp(2.75rem, 6vw, 4.5rem)` (~72px desktop), `--labs-text-section: 2.25rem` (36px), `--labs-text-card: 1.375rem` (22px), `--labs-text-body: 1.0625rem` (17px), `--labs-text-meta: 0.8125rem` (13px). Wire `.heading` sizes / `.prose-labs` / hero / section titles to these instead of mixed Tailwind `text-xl`/`text-2xl`/`text-3xl`/`text-lg`.
- [ ] `labs/index.html` hero `<p>` + post deck copy: cap line length `"Aim around 60-70 characters"`: set `max-w-[38rem]` or `max-width: 70ch` on hero lead and `.prose-labs` (posts already `max-w-3xl`; tighten if measure still wide).
- [ ] `labs/assets/labs.css` radius system (feedback: buttons 12 / cards 20 / badges 999 / sections 32): replace current `--labs-radius-lg: 1.5rem` / `--labs-radius-md: 1rem` and one-off `1.25rem` carousel with `--labs-radius-btn: 0.75rem`, `--labs-radius-card: 1.25rem`, `--labs-radius-badge: 999px`, `--labs-radius-panel: 2rem`. Swap Tailwind `rounded-xl`/`rounded-2xl`/`rounded-3xl` on brand-mark, glass cards, model tiles, filters, carousel slides to these classes/vars.
- [ ] `labs/assets/labs.css` `.glass`: match Linear-style depth quote: `background: rgba(255,255,255,.02)`, `border: 1px solid rgba(255,255,255,.06)`, keep blur, add `box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px rgba(0,0,0,.25)`. Drop "rectangle with border" feel.
- [ ] `labs/assets/labs.css` `.glass-hover:hover`: intentional motion per feedback: `translateY(-4px)`, stronger shadow, `border-color` brighter (~`.12` white), duration `250ms`, `ease-out` (or shared `--labs-ease-out`). Title brighten stays; bump from current `-2px` only.
- [ ] `labs/assets/labs.css` `:root`: add `--labs-duration: 250ms`, `--labs-ease-out: cubic-bezier(0,0,.2,1)`; point `.card-transition` at these (stop `transition: all`).
- [ ] `labs/assets/labs.css` + `index.html` / `ideas.html`: unify icon wells. Ideas/Experiments/Models currently `bg-violet-500/10` + `bg-indigo-500/10` + `bg-cyan-500/10`. Feedback: *"90% black/gray/white, 10% purple"*. Make wells zinc (`bg-white/5`) and icons `text-zinc-400`; reserve violet for brand-mark, active filter, status ACTIVE, and one hover title color.
- [ ] `labs/index.html` `renderPinnedIdeas` / `renderExperiments` / `renderModels` / `renderLatest`: same accent restraint. Replace `bg-violet-500` bullets, `hover:text-indigo-300`, `text-cyan-400` icons with zinc defaults + single `--labs-violet` hover (`group-hover:text-violet-300` only).
- [ ] `labs/assets/labs.css` `.context-card`: stop soft violet wash competing with glass. Use same `.glass` base (or shared `.labs-surface`); keep uppercase system label style but color `var(--labs-muted)` or faint zinc, not `#c4b5fd` everywhere ("Make the accent color earn attention").
- [ ] `labs/index.html` + `ideas.html` + post templates: section labels. Add one small uppercase "system label" above each major section title (e.g. `LAB` / `STREAM` / `CONTEXT`) using `.labs-label` = `text-[13px] tracking-[0.14em] uppercase text-zinc-500`, per bonus design-language note.
- [ ] `labs/index.html` experiment status pills: map statuses to one badge component. `ACTIVE`/`RUNNING`/`PROTOTYPE` uppercase, shared `rounded-full` + zinc glass; only ACTIVE gets violet tint (design language: every card has a status).
- [ ] Spacing pass on `labs/index.html`: hero `pt-14 pb-14` → `pt-16 pb-20`; context `mt-12` → `mt-16`; column grid `mt-14 gap-6` → `mt-16 gap-8`; latest `mt-20 mb-8` → `mt-24 mb-10`; about `mt-24` → `mt-28`; card padding `p-7 md:p-8` → `p-8 md:p-9` (or CSS `padding: var(--labs-space-6)`).
- [ ] Spacing pass on `labs/ideas.html`: align section gaps to same tokens as index (`mt-10`/`mt-14`/`mt-16` → consistent 16/24/32 rhythm); pinned/all card padding `p-6` → match stream cards.
- [ ] `labs/assets/labs.css` `.post-card__body` + `.context-card`: normalize padding to one value (e.g. `1.5rem`); ensure cover radius uses `--labs-radius-card` top corners only.
- [ ] `labs/posts/*.html` meta row: category chip already `rounded-full glass text-violet-300`. Keep violet only on that chip; date/author stay zinc. Ensure chip uses `--labs-radius-badge` + `--labs-text-meta`.
- [ ] Nav links (`index`/`ideas`/posts): shared hover. Color to white + optional underline-from-center via `.labs-nav-link::after` scaleX transition (250ms); replace bare `hover:text-white transition-colors` only.
- [ ] Alignment: ensure column card headers (icon + h2) share identical `h-10` icon well, `gap-3`, and baseline; buttons/filters share identical height (`h-8` / `py-1.5` locked). "margins are multiples of 4 or 8."

---

## Should-fix

- [ ] `labs/index.html` hero: add **one** quiet visual anchor under/behind headline (CSS-only: soft node grid or slow aurora on `.labs-glow`, opacity ≤0.15). Feedback: without it people remember "dark website"; with it "that systems website." Keep tiny: no new section.
- [ ] `labs/assets/labs.css` `.labs-glow`: slow breathing. `background-position` or opacity pulse ~8-12s, no constant motion. Feedback: "Aurora shifts. Gradient moves 1%."
- [ ] `labs/index.html` nav labels (desktop + mobile): rename for brand personality. `Context→Lab`, keep `Experiments`, `Mental Models→Frameworks` or `Models`, `Latest→Archive` or `Notes`, drop or fold `About` into Lab. Feedback example set: Lab / Experiments / Frameworks / Archive / Notes. Update hrefs to existing anchors.
- [ ] End-of-section cues on index: after context strip and after 3-column grid, add one quiet text link (`Explore experiments ↓`, `Read the stream →`). Quote: "Every section should invite the next interaction." No big CTAs.
- [ ] `labs/ideas.html` `.filter-btn.active`: use violet border/text sparingly (one accent) instead of generic white wash; inactive stay zinc border.
- [ ] Post covers / carousel: soft mask. Top/bottom gradient fade or 1px inner highlight on `.post-cover` / `.carousel-slide img` ("Never use plain rectangles. soft masks, inner shadows"). Keep existing 3:4 / slide assets.
- [ ] Card hover micro: model tile icon `rotate(3deg)` on `.glass-hover:hover i` only; do not add tilt on whole page.
- [ ] Links in `.prose-labs a` (if any) + footer links: same underline-from-center motion as nav.
- [ ] `labs/index.html` About + footer: add 8-16px more vertical padding; ensure footer top border uses `--labs-line` token, not one-off zinc class drift.
- [ ] Document tokens at top of `labs.css` in a short comment block (radius, type, space, motion, when to use violet) so future post HTML stops inventing new Tailwind radius/color combos.

---

## Explicitly skip

- Full homepage redesign or new marketing sections ("Don't redesign the site. Don't add more sections.").
- Alternating layout rewrite (text/image/quote/timeline rhythm): too large for this pass.
- Per-section "personality skins" (lab notebook vs magazine vs dashboard): defer until tokens exist.
- Magnetic button hover, scroll-progress bar, count-up numbers, 3D card tilt everywhere: polish later; not required for cohesion.
- Hero rebuild into animated neural graph / blueprint illustration (asset-heavy); CSS-only hint in Should-fix is enough.
- Replacing Tailwind CDN with a build pipeline.
- Rewriting post prose, adding images sitewide, or SEO/indexing work from the ChatGPT preamble.
- Changing brand fonts away from Space Grotesk + Inter, or abandoning glass/zinc/violet.
- Em dash / en dash "stylistic" copy edits beyond accidental introduction in new UI strings.
