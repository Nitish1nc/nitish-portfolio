import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { writeCarousel } from './carousel.mjs';
import { dateStamp, displayDate, shortDate } from './extract.mjs';
import { CONTENT_DIR, LABS_ROOT, POSTS_DIR, REPO_ROOT } from './paths.mjs';

export function publishIdea({ doc, sourcePath, config, sourceImagePath = null }) {
 const date = dateStamp();
 let slug = doc.slug;
 let postPath = path.join(POSTS_DIR, `${slug}.html`);
 let i = 2;
 while (fs.existsSync(postPath)) {
 slug = `${doc.slug}-${i}`;
 postPath = path.join(POSTS_DIR, `${slug}.html`);
 i += 1;
 }

 const carouselDir = path.join(POSTS_DIR, slug, 'carousel');
 const { slides } = writeCarousel({
 outDir: carouselDir,
 title: doc.title,
 subtitle: doc.excerpt,
 bullets: doc.bullets,
 takeaway: doc.bullets[doc.bullets.length - 1],
 });

 if (sourceImagePath) {
 const ext = path.extname(sourceImagePath).toLowerCase() || '.png';
 fs.copyFileSync(sourceImagePath, path.join(carouselDir, `source-visual${ext}`));
 }

 const html = renderPostHtml({
 slug,
 title: doc.title,
 excerpt: doc.excerpt,
 category: doc.category,
 dateLabel: displayDate(),
 sourceName: doc.sourceName,
 bullets: doc.bullets,
 bodyParagraphs: bodyFromText(doc.text),
 slideCount: slides.length,
 });
 fs.writeFileSync(postPath, html, 'utf8');

 const postMeta = {
 slug,
 title: doc.title,
 excerpt: doc.excerpt,
 category: doc.category,
 date,
 href: `posts/${slug}.html`,
 carousel: `posts/${slug}/carousel/`,
 source: doc.sourceName,
 };

 prependJsonArray(path.join(CONTENT_DIR, 'posts.json'), postMeta);
 prependJsonArray(path.join(CONTENT_DIR, 'ideas-stream.json'), {
 title: doc.title,
 excerpt: doc.excerpt,
 category: doc.category,
 date: shortDate(),
 group: doc.category === 'Models' || doc.category === 'Experiments' || doc.category === 'Ideas'
 ? doc.category
 : 'Ideas',
 href: `posts/${slug}.html`,
 });

 let deployed = false;
 let deployError = null;
 if (config.autoDeploy) {
 try {
 execFileSync('bash', [path.join(REPO_ROOT, 'scripts/deploy-labs.sh')], {
 cwd: REPO_ROOT,
 stdio: 'pipe',
 encoding: 'utf8',
 });
 deployed = true;
 } catch (err) {
 deployError = err.stderr || err.message || String(err);
 }
 }

 const url = `https://labs.nitishchauhan.com/ideas`;
 const postUrl = `https://labs.nitishchauhan.com/posts/${slug}.html`;

 return {
 slug,
 postPath,
 carouselDir,
 postMeta,
 deployed,
 deployError,
 url,
 postUrl,
 sourcePath,
 };
}

function prependJsonArray(filePath, item) {
 let arr = [];
 if (fs.existsSync(filePath)) {
 arr = JSON.parse(fs.readFileSync(filePath, 'utf8'));
 if (!Array.isArray(arr)) arr = [];
 }
 arr = [item, ...arr.filter((x) => x.slug !== item.slug && x.href !== item.href)];
 fs.writeFileSync(filePath, `${JSON.stringify(arr, null, 2)}\n`, 'utf8');
}

function bodyFromText(text) {
 const paras = String(text || '')
 .split(/\n{2,}/)
 .map((p) => p.replace(/\s+/g, ' ').trim())
 .filter((p) => p.length > 40)
 .slice(0, 8);
 if (paras.length) return paras;
 return [
 'This note was auto-captured from Downloads into NitishLabs. The Visual Wiki Map carousel above compresses the structure; refine the prose when capacity returns.',
 ];
}

function esc(s) {
 return String(s)
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;');
}

function renderPostHtml({
 slug,
 title,
 excerpt,
 category,
 dateLabel,
 sourceName,
 bullets,
 bodyParagraphs,
 slideCount,
}) {
 const bulletHtml = bullets
 .map((b) => `<li>${esc(b)}</li>`)
 .join('\n');
 const bodyHtml = bodyParagraphs.map((p) => `<p>${esc(p)}</p>`).join('\n');
 const slidesHtml = Array.from({ length: slideCount }, (_, i) => {
 const n = String(i + 1).padStart(2, '0');
 return `<figure class="carousel-slide"><img src="${slug}/carousel/slide-${n}.svg" alt="Visual Wiki Map slide ${i + 1}" width="1080" height="1350" loading="${i === 0 ? 'eager' : 'lazy'}" /></figure>`;
 }).join('\n');

 return `<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <title>${esc(title)} - NitishLabs</title>
 <meta name="description" content="${esc(excerpt)}" />
 <meta name="theme-color" content="#09090b" />
 <link rel="canonical" href="https://labs.nitishchauhan.com/posts/${esc(slug)}.html" />
 <script src="https://cdn.tailwindcss.com"></script>
 <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
 <link rel="preconnect" href="https://fonts.googleapis.com" />
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
 <style>
 body { font-family: 'Inter', system-ui, sans-serif; }
 .heading { font-family: 'Space Grotesk', sans-serif; }
 .glass {
 background: rgba(255, 255, 255, 0.04);
 backdrop-filter: blur(16px);
 -webkit-backdrop-filter: blur(16px);
 border: 1px solid rgba(255, 255, 255, 0.08);
 }
 .prose-labs p { margin-bottom: 1.15rem; color: #a1a1aa; line-height: 1.75; }
 .prose-labs h2 { font-family: 'Space Grotesk', sans-serif; color: #fff; font-size: 1.35rem; font-weight: 600; margin: 2.25rem 0 0.85rem; }
 .prose-labs ul { margin: 0 0 1.25rem; padding-left: 1.2rem; color: #a1a1aa; }
 .prose-labs li { margin-bottom: 0.45rem; line-height: 1.65; }
 .carousel-track {
 display: flex;
 gap: 1rem;
 overflow-x: auto;
 scroll-snap-type: x mandatory;
 padding-bottom: 0.5rem;
 -webkit-overflow-scrolling: touch;
 }
 .carousel-slide {
 flex: 0 0 min(86vw, 420px);
 scroll-snap-align: start;
 margin: 0;
 }
 .carousel-slide img {
 width: 100%;
 height: auto;
 border-radius: 1.25rem;
 border: 1px solid rgba(255,255,255,0.08);
 background: #f7f5f1;
 }
 </style>
</head>
<body class="bg-zinc-950 text-zinc-200 antialiased">
 <nav class="fixed top-0 w-full z-50 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
 <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
 <a href="../index.html" class="flex items-center gap-3 group">
 <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/20">N</div>
 <span class="heading text-xl font-semibold tracking-tight group-hover:text-white transition-colors">NitishLabs</span>
 </a>
 <div class="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
 <a href="../index.html" class="hover:text-white transition-colors">Home</a>
 <a href="../ideas.html" class="hover:text-white transition-colors">Latest</a>
 </div>
 </div>
 </nav>

 <main class="pt-24 pb-24">
 <article class="max-w-3xl mx-auto px-6">
 <header class="pt-10 pb-10 border-b border-zinc-800/60">
 <div class="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500 mb-5">
 <span class="px-2.5 py-1 rounded-full glass text-violet-300">${esc(category)}</span>
 <span>${esc(dateLabel)}</span>
 <span class="text-zinc-700">·</span>
 <span>Nitish Chauhan</span>
 </div>
 <h1 class="heading text-4xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-[1.15]">
 ${esc(title)}
 </h1>
 <p class="text-lg text-zinc-400 leading-relaxed">${esc(excerpt)}</p>
 </header>

 <section class="pt-10" aria-label="Visual Wiki Map carousel">
 <div class="flex items-end justify-between gap-4 mb-4">
 <div>
 <h2 class="heading text-xl font-semibold text-white">Visual Wiki Map</h2>
 <p class="text-sm text-zinc-500 mt-1">LinkedIn-style compressed carousel · swipe</p>
 </div>
 <span class="text-xs text-zinc-600">${slideCount} slides</span>
 </div>
 <div class="carousel-track">
${slidesHtml}
 </div>
 </section>

 <div class="prose-labs pt-10">
 <h2>Structure</h2>
 <ul>
${bulletHtml}
 </ul>
 <h2>Notes</h2>
${bodyHtml}
 <p class="text-sm text-zinc-600">Source capture: ${esc(sourceName)}</p>
 </div>
 </article>
 </main>

 <footer class="border-t border-zinc-800/60 py-10">
 <div class="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
 <div>© 2026 NitishLabs</div>
 <a href="../ideas.html" class="hover:text-white transition-colors">← Latest ideas</a>
 </div>
 </footer>
</body>
</html>
`;
}

export function labsRootExists() {
 return fs.existsSync(LABS_ROOT);
}
