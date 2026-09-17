import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOT,
  loadDashboard,
  validateDashboard,
  lintDashes,
} from "./validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, "../..");
const RUNTIME = path.join(ROOT, "runtime");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Allow intentional <strong>/<em> in intro HTML from schema. */
function sanitizeRich(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;(\/?(?:strong|em))&gt;/gi, "<$1>");
}

function resolveOutDir(doc, target) {
  const host = target || (doc.host === "both" ? "portfolio" : doc.host);
  if (host === "labs") return path.join(REPO, "labs", doc.slug);
  if (host === "essay") return path.join(REPO, "labs", "posts");
  return path.join(REPO, "public", doc.slug);
}

function canonicalFor(doc, host) {
  if (doc.canonicalUrl) return doc.canonicalUrl;
  if (host === "labs") return `https://labs.nitishchauhan.com/${doc.slug}/`;
  if (host === "essay") {
    return `https://labs.nitishchauhan.com/posts/${doc.slug}.html`;
  }
  return `https://www.nitishchauhan.com/${doc.slug}/`;
}

function assetPrefix(host) {
  return host === "labs" ? "../" : "";
}

function cssHref(host) {
  if (host === "labs") {
    return {
      tw: "../assets/tailwind.css?v=n2d1",
      labs: "../assets/labs.css?v=n2d1",
      page: "page.css?v=n2d1",
    };
  }
  return {
    tw: "assets/tailwind.css?v=n2d1",
    labs: "assets/labs.css?v=n2d1",
    page: "page.css?v=n2d1",
  };
}

function renderContrast(doc) {
  if (!doc.contrast) return "";
  return `
        <div class="iv-hero-contrast" aria-label="Before and after contrast">
          <div class="iv-contrast-card">
            <h3>${escapeHtml(doc.contrast.left.label)}</h3>
            <p>${escapeHtml(doc.contrast.left.body)}</p>
          </div>
          <div class="iv-contrast-card iv-contrast-card--held">
            <h3>${escapeHtml(doc.contrast.right.label)}</h3>
            <p>${escapeHtml(doc.contrast.right.body)}</p>
          </div>
        </div>`;
}

function renderLede(doc) {
  const parts = doc.lede || [doc.hook];
  return parts
    .map((p, i) => {
      const cls =
        i === 0
          ? 'text-lg text-zinc-400 leading-relaxed iv-lede'
          : "iv-lede-follow";
      return `<p class="${cls}">${sanitizeRich(p)}</p>`;
    })
    .join("\n        ");
}

function renderHow(doc) {
  if (!doc.howThisWorks) return "";
  return `
        <section class="iv-how" aria-labelledby="how-heading">
          <h2 id="how-heading">How this page works</h2>
          <p>${escapeHtml(doc.howThisWorks)}</p>
        </section>`;
}

function renderSectionsStatic(doc) {
  if (!Array.isArray(doc.sections) || !doc.sections.length) return "";
  return doc.sections
    .map((s, i) => {
      return `
        <section class="iv-how" aria-labelledby="sec-${i}">
          <h2 id="sec-${i}">${escapeHtml(s.heading)}</h2>
          <p>${escapeHtml(s.body)}</p>
          ${
            s.widget
              ? `<div class="iv-static-widget" data-widget='${escapeHtml(
                  JSON.stringify(s.widget)
                )}'></div>`
              : ""
          }
        </section>`;
    })
    .join("\n");
}

function renderFoundations(doc) {
  if (!Array.isArray(doc.foundations) || !doc.foundations.length) return "";
  const cards = doc.foundations
    .map(
      (f) => `
          <article class="iv-foundation">
            <div class="iv-foundation__head">
              <span class="iv-foundation__badge">${escapeHtml(f.badge)}</span>
              <div>
                <h3>${escapeHtml(f.title)}</h3>
                <p class="iv-foundation__cite">${escapeHtml(f.cite)}</p>
              </div>
            </div>
            <p>${sanitizeRich(f.body)}</p>
          </article>`
    )
    .join("\n");
  return `
      <details class="iv-foundations">
        <summary>
          <span class="iv-foundations__title">Core scientific foundations</span>
          <span class="iv-foundations__hint">Source cites</span>
        </summary>
        <div class="iv-foundations__body">${cards}
        </div>
      </details>`;
}

function renderTerms(doc) {
  if (!Array.isArray(doc.terms) || !doc.terms.length) return "";
  const chips = doc.terms
    .map((t) => `<li><span class="iv-term">${escapeHtml(t)}</span></li>`)
    .join("\n          ");
  return `
      <aside class="iv-caveat glass">
        <p class="iv-caveat__label">Terms on this page</p>
        <ul class="iv-caveat__terms" aria-label="Key terms">
          ${chips}
        </ul>
        ${
          doc.caveat
            ? `<p class="iv-caveat__note">${escapeHtml(doc.caveat)}</p>`
            : ""
        }
      </aside>`;
}

function renderPortfolioNav() {
  return `
  <nav class="labs-nav" aria-label="Site">
    <div class="labs-nav__inner">
      <a href="https://www.nitishchauhan.com/" class="flex items-center gap-3 group">
        <span class="cs-brand-mark" aria-hidden="true">NC</span>
        <span class="heading text-lg font-semibold tracking-tight text-white">Nitish Chauhan</span>
      </a>
      <div class="labs-nav__links">
        <a href="https://www.nitishchauhan.com/" class="nav-link">Portfolio</a>
        <a href="https://labs.nitishchauhan.com/" class="nav-link">Labs</a>
        <a href="https://labs.nitishchauhan.com/ideas.html" class="nav-link">Latest</a>
        <a href="https://labs.nitishchauhan.com/#experiments" class="nav-link is-active" aria-current="page">Experiments</a>
      </div>
      <button type="button" id="menu-btn" class="labs-nav__menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
        <i class="fa-solid fa-bars text-lg" aria-hidden="true"></i>
      </button>
    </div>
    <div id="mobile-nav" class="labs-nav__mobile hidden" hidden>
      <a href="https://www.nitishchauhan.com/" class="block nav-link">Portfolio</a>
      <a href="https://labs.nitishchauhan.com/" class="block nav-link">Labs</a>
      <a href="https://labs.nitishchauhan.com/ideas.html" class="block nav-link">Latest</a>
      <a href="https://labs.nitishchauhan.com/#experiments" class="block nav-link is-active" aria-current="page">Experiments</a>
    </div>
  </nav>`;
}

function renderLabsNavPlaceholders() {
  return `
  <div data-labs-nav data-labs-variant="article" data-labs-active="Experiments"></div>`;
}

function renderFooter(host) {
  if (host === "labs") {
    return `<div data-labs-footer data-labs-variant="article"></div>
  <script src="../assets/shell.js?v=n2d1"></script>`;
  }
  return `
  <footer class="article-footer labs-shell-footer">
    <a href="https://labs.nitishchauhan.com/ideas.html">← Latest from the Lab</a>
    <a href="https://www.nitishchauhan.com/">Portfolio home</a>
  </footer>
  <script>
    (function () {
      var menuBtn = document.getElementById('menu-btn');
      var mobileNav = document.getElementById('mobile-nav');
      if (!menuBtn || !mobileNav) return;
      function setOpen(open) {
        mobileNav.classList.toggle('hidden', !open);
        if (open) mobileNav.removeAttribute('hidden');
        else mobileNav.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      setOpen(false);
      menuBtn.addEventListener('click', function () {
        setOpen(mobileNav.classList.contains('hidden'));
      });
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { setOpen(false); });
      });
    })();
  </script>`;
}

function renderOgSvg(doc) {
  const title = escapeHtml(doc.title).slice(0, 60);
  const sub = escapeHtml(doc.eyebrow || doc.excerpt).slice(0, 80);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#09090b"/>
      <stop offset="1" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="180" fill="#6366f1" opacity="0.12"/>
  <text x="80" y="100" font-family="system-ui,sans-serif" font-size="20" fill="#a1a1aa" letter-spacing="0.14em">NITISH CHAUHAN</text>
  <text x="80" y="320" font-family="Georgia,serif" font-size="48" fill="#fafafa">${title}</text>
  <text x="80" y="390" font-family="system-ui,sans-serif" font-size="24" fill="#a78bfa">${sub}</text>
  <path d="M80 480 C 280 420, 480 520, 720 460 S 1000 420, 1120 470" fill="none" stroke="url(#arc)" stroke-width="5" stroke-linecap="round"/>
</svg>
`;
}

function renderFavicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Dashboard">
  <rect width="32" height="32" rx="8" fill="#09090b"/>
  <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="#8b5cf6" stroke-width="1.2"/>
  <path d="M8 22.5c2.5-4.5 5-6 8-6s5.5 1.5 8 6" fill="none" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="24" cy="21" r="2" fill="#22d3ee"/>
</svg>
`;
}

function buildIndexHtml(doc, host) {
  const css = cssHref(host);
  const canonical = canonicalFor(doc, host);
  const ogImage =
    host === "labs"
      ? `https://labs.nitishchauhan.com/${doc.slug}/og.svg`
      : `https://www.nitishchauhan.com/${doc.slug}/og.svg`;
  const nav =
    host === "labs" ? renderLabsNavPlaceholders() : renderPortfolioNav();
  const labMount =
    doc.archetype === "stepper-lab" || doc.archetype === "contrast-toggle"
      ? `<div id="lab-app" aria-live="polite"></div>`
      : renderSectionsStatic(doc);
  const takeawayTitle = escapeHtml(doc.takeawayTitle || "Takeaway");
  const takeawayHidden =
    doc.archetype === "stepper-lab" || doc.archetype === "contrast-toggle"
      ? " hidden"
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(doc.title)} - Nitish Chauhan</title>
  <meta name="description" content="${escapeHtml(doc.excerpt)}" />
  <meta name="author" content="Nitish Chauhan" />
  <meta name="theme-color" content="#09090b" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <link rel="icon" href="${host === "labs" ? "../favicon.svg" : "favicon.svg"}" type="image/svg+xml" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${host === "labs" ? "Nitish Labs" : "Nitish Chauhan"}" />
  <meta property="og:title" content="${escapeHtml(doc.title)}" />
  <meta property="og:description" content="${escapeHtml(doc.excerpt)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(doc.ogAlt || doc.title)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(doc.title)}" />
  <meta name="twitter:description" content="${escapeHtml(doc.excerpt)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${css.tw}" />
  <link rel="stylesheet" href="${css.labs}" />
  <link rel="stylesheet" href="${css.page}" />
</head>
<body class="antialiased iv-labs-page">
${nav}

  <main class="pt-24 pb-24">
    <article class="iv-page max-w-3xl mx-auto px-6">
      <header class="article-header">
        <div class="meta-row">
          <span class="meta-chip">${escapeHtml(doc.category)}</span>
          <span>${escapeHtml(doc.dateDisplay || doc.date)}</span>
          <span class="meta-sep">·</span>
          <span>Nitish Chauhan</span>
        </div>
        ${
          doc.eyebrow
            ? `<p class="iv-science-label">${escapeHtml(doc.eyebrow)}</p>`
            : ""
        }
        <h1 class="heading text-4xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-[1.15]">
          ${escapeHtml(doc.title)}
        </h1>
        ${renderLede(doc)}
        ${renderContrast(doc)}
        ${renderHow(doc)}
      </header>

      ${labMount}

      <section id="takeaway"${takeawayHidden}>
        <h2 class="heading">${takeawayTitle}</h2>
        <p>${doc.takeaway ? escapeHtml(doc.takeaway) : ""}</p>
      </section>

      ${renderFoundations(doc)}
      ${renderTerms(doc)}
    </article>
  </main>

${renderFooter(host)}
  <script type="application/json" id="dashboard-data">${JSON.stringify(doc)}</script>
  <script src="app.js"></script>
</body>
</html>
`;
}

function patchShellExperimentDirs(slug) {
  const shellPath = path.join(REPO, "labs", "assets", "shell.js");
  if (!fs.existsSync(shellPath)) return false;
  let src = fs.readFileSync(shellPath, "utf8");
  const m = src.match(/EXPERIMENT_DIRS\s*=\s*\[([^\]]*)\]/);
  if (!m) return false;
  if (m[1].includes(`'${slug}'`) || m[1].includes(`"${slug}"`)) return false;
  const next = m[0].replace(
    "[",
    `['${slug}', `
  );
  src = src.replace(m[0], next);
  fs.writeFileSync(shellPath, src);
  return true;
}

/**
 * @param {object} opts
 * @param {string} opts.schemaPath
 * @param {string} [opts.target] labs|portfolio
 * @param {boolean} [opts.force]
 */
export function scaffold({ schemaPath, target, force = false }) {
  const doc = loadDashboard(schemaPath);
  const errors = validateDashboard(doc);
  if (errors.length) {
    const err = new Error("Schema validation failed:\n- " + errors.join("\n- "));
    err.code = "VALIDATE";
    throw err;
  }
  const dashHits = lintDashes(doc);
  if (dashHits.length) {
    const err = new Error(
      "Em/en dashes found in copy (use commas, colon, or spaced hyphen):\n- " +
        dashHits.slice(0, 8).join("\n- ")
    );
    err.code = "DASH";
    throw err;
  }

  const host =
    target ||
    (doc.host === "both" || doc.host === "essay" ? "portfolio" : doc.host);
  if (host === "essay") {
    const err = new Error(
      "ideas-essay scaffold is not implemented in v1 (use stepper-lab, scroll-explainer, or contrast-toggle)."
    );
    err.code = "ARCHETYPE";
    throw err;
  }

  const outDir = resolveOutDir(doc, host);
  if (fs.existsSync(outDir) && !force) {
    const err = new Error(
      `Output exists: ${outDir} (pass --force to overwrite)`
    );
    err.code = "EXISTS";
    throw err;
  }
  ensureDir(outDir);

  // Runtime + CSS
  copyFile(path.join(RUNTIME, "app.js"), path.join(outDir, "app.js"));
  copyFile(path.join(RUNTIME, "page.css"), path.join(outDir, "page.css"));

  if (host === "portfolio") {
    const assetsDir = path.join(outDir, "assets");
    ensureDir(assetsDir);
    copyFile(
      path.join(REPO, "labs", "assets", "labs.css"),
      path.join(assetsDir, "labs.css")
    );
    copyFile(
      path.join(REPO, "labs", "assets", "tailwind.css"),
      path.join(assetsDir, "tailwind.css")
    );
  }

  fs.writeFileSync(path.join(outDir, "index.html"), buildIndexHtml(doc, host));
  fs.writeFileSync(
    path.join(outDir, "dashboard.json"),
    JSON.stringify(doc, null, 2) + "\n"
  );
  fs.writeFileSync(path.join(outDir, "og.svg"), renderOgSvg(doc));
  fs.writeFileSync(path.join(outDir, "favicon.svg"), renderFavicon());

  let shellPatched = false;
  if (host === "labs") {
    shellPatched = patchShellExperimentDirs(doc.slug);
  }

  return {
    outDir,
    host,
    slug: doc.slug,
    archetype: doc.archetype,
    shellPatched,
    canonical: canonicalFor(doc, host),
  };
}
