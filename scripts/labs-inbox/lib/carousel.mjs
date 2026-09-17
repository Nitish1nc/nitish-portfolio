import fs from 'node:fs';
import path from 'node:path';

/** LinkedIn carousel slide size (4:5). Visual Wiki Map density rules applied. */
const W = 1080;
const H = 1350;

const PALETTE = {
 bg: '#f7f5f1',
 ink: '#14213d',
 muted: '#4a5568',
 teal: '#0f766e',
 coral: '#e07a5f',
 gold: '#c9a227',
 navy: '#1d3557',
 card: '#ffffff',
 line: '#d6d3d1',
};

export function writeCarousel({ outDir, title, subtitle, bullets, takeaway }) {
 fs.mkdirSync(outDir, { recursive: true });

 const slides = buildSlidePlan(title, subtitle, bullets, takeaway);
 const files = [];

 slides.forEach((slide, i) => {
 const n = String(i + 1).padStart(2, '0');
 const file = path.join(outDir, `slide-${n}.svg`);
 fs.writeFileSync(file, renderSlideSvg(slide, i + 1, slides.length), 'utf8');
 files.push(file);
 });

 const manifest = {
 format: 'linkedin-carousel',
 aspect: '1080x1350',
 skill: 'visual-wiki-maps',
 slideCount: slides.length,
 slides: files.map((f) => path.basename(f)),
 };
 fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
 return { slides: files, manifest };
}

function buildSlidePlan(title, subtitle, bullets, takeaway) {
 const slides = [
 {
 kind: 'cover',
 title: truncate(title, 70),
 subtitle: truncate(subtitle || 'Visual Wiki Map · NitishLabs', 110),
 },
 ];

 const chunks = chunk(bullets, 2);
 chunks.forEach((pair, idx) => {
 slides.push({
 kind: 'levels',
 title: idx === 0 ? 'Core Structure' : `Layer ${idx + 1}`,
 items: pair.map((text, j) => ({
 n: idx * 2 + j + 1,
 text: truncate(text, 140),
 })),
 });
 });

 slides.push({
 kind: 'takeaway',
 title: 'Strategy Lock',
 body: truncate(
 takeaway ||
 'Compress → publish → get a return signal. Density without a loop is leakage.',
 180,
 ),
 });

 return slides.slice(0, 8);
}

function renderSlideSvg(slide, index, total) {
 const footer = `NitishLabs · Visual Wiki Map · ${index}/${total}`;

 if (slide.kind === 'cover') {
 return svgShell(`
 <rect x="72" y="120" width="120" height="10" rx="5" fill="${PALETTE.teal}"/>
 <text x="72" y="220" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="700" fill="${PALETTE.ink}">
 ${wrapText(slide.title, 28).map((line, i) => `<tspan x="72" dy="${i === 0 ? 0 : 66}">${esc(line)}</tspan>`).join('')}
 </text>
 <text x="72" y="520" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="${PALETTE.muted}">
 ${wrapText(slide.subtitle, 42).map((line, i) => `<tspan x="72" dy="${i === 0 ? 0 : 38}">${esc(line)}</tspan>`).join('')}
 </text>
 <g transform="translate(72, 700)">
 ${dimensionCards()}
 </g>
 <text x="72" y="1260" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="${PALETTE.muted}">${esc(footer)}</text>
 `);
 }

 if (slide.kind === 'levels') {
 const cards = slide.items
 .map((item, i) => levelCard(item.n, item.text, i))
 .join('');
 return svgShell(`
 <text x="72" y="140" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="${PALETTE.teal}" letter-spacing="2">${esc('VISUAL WIKI MAP')}</text>
 <text x="72" y="200" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="700" fill="${PALETTE.ink}">${esc(slide.title)}</text>
 ${cards}
 <text x="72" y="1260" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="${PALETTE.muted}">${esc(footer)}</text>
 `);
 }

 return svgShell(`
 <rect x="72" y="180" width="${W - 144}" height="780" rx="28" fill="${PALETTE.navy}"/>
 <text x="120" y="280" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="${PALETTE.gold}" letter-spacing="2">${esc('TAKEAWAY')}</text>
 <text x="120" y="360" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700" fill="#fff">
 ${wrapText(slide.title, 26).map((line, i) => `<tspan x="120" dy="${i === 0 ? 0 : 56}">${esc(line)}</tspan>`).join('')}
 </text>
 <text x="120" y="560" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#e5e7eb">
 ${wrapText(slide.body, 38).map((line, i) => `<tspan x="120" dy="${i === 0 ? 0 : 40}">${esc(line)}</tspan>`).join('')}
 </text>
 <text x="72" y="1260" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="${PALETTE.muted}">${esc(footer)}</text>
 `);
}

function levelCard(n, text, i) {
 const y = 260 + i * 320;
 const accent = [PALETTE.teal, PALETTE.coral, PALETTE.gold, PALETTE.navy][n % 4];
 return `
 <g transform="translate(72, ${y})">
 <rect width="${W - 144}" height="280" rx="24" fill="${PALETTE.card}" stroke="${PALETTE.line}" stroke-width="2"/>
 <circle cx="56" cy="56" r="34" fill="${accent}"/>
 <text x="56" y="66" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#fff">${n}</text>
 <text x="120" y="70" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="${PALETTE.ink}">Level ${n}</text>
 <text x="48" y="140" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="${PALETTE.muted}">
 ${wrapText(text, 40).map((line, li) => `<tspan x="48" dy="${li === 0 ? 0 : 34}">${esc(line)}</tspan>`).join('')}
 </text>
 </g>
 `;
}

function dimensionCards() {
 const dims = [
 { label: 'Structure', color: PALETTE.teal },
 { label: 'Density', color: PALETTE.coral },
 { label: 'Return Loop', color: PALETTE.gold },
 ];
 return dims
 .map((d, i) => {
 const x = i * 300;
 return `
 <g transform="translate(${x}, 0)">
 <rect width="280" height="120" rx="18" fill="${PALETTE.card}" stroke="${PALETTE.line}" stroke-width="2"/>
 <rect x="0" y="0" width="12" height="120" rx="6" fill="${d.color}"/>
 <text x="36" y="70" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="${PALETTE.ink}">${esc(d.label)}</text>
 </g>
 `;
 })
 .join('');
}

function svgShell(inner) {
 return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
 <rect width="${W}" height="${H}" fill="${PALETTE.bg}"/>
 <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="36" fill="none" stroke="${PALETTE.line}" stroke-width="2"/>
 ${inner}
</svg>
`;
}

function wrapText(text, width) {
 const words = String(text || '').split(/\s+/);
 const lines = [];
 let cur = '';
 for (const w of words) {
 const next = cur ? `${cur} ${w}` : w;
 if (next.length > width && cur) {
 lines.push(cur);
 cur = w;
 } else {
 cur = next;
 }
 }
 if (cur) lines.push(cur);
 return lines.slice(0, 5);
}

function truncate(s, n) {
 const t = String(s || '').replace(/\s+/g, ' ').trim();
 return t.length <= n ? t : `${t.slice(0, n - 1).trim()}…`;
}

function chunk(arr, size) {
 const out = [];
 for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
 return out;
}

function esc(s) {
 return String(s)
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;');
}
