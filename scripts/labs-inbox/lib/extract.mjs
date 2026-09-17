import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function peekText(filePath, maxBytes = 8000) {
 const ext = path.extname(filePath).toLowerCase();
 try {
 if (['.md', '.markdown', '.txt', '.html', '.htm', '.rtf', '.svg'].includes(ext)) {
 return fs.readFileSync(filePath, 'utf8').slice(0, maxBytes);
 }
 if (ext === '.json') {
 return fs.readFileSync(filePath, 'utf8').slice(0, maxBytes);
 }
 if (ext === '.pdf') {
 return execFileSync('pdftotext', ['-l', '2', '-layout', filePath, '-'], {
 encoding: 'utf8',
 maxBuffer: 2 * 1024 * 1024,
 }).slice(0, maxBytes);
 }
 } catch {
 return '';
 }
 return '';
}

export function extractDocument(filePath) {
 const ext = path.extname(filePath).toLowerCase();
 const baseName = path.basename(filePath, ext);
 let text = '';

 if (ext === '.pdf') {
 try {
 text = execFileSync('pdftotext', ['-layout', filePath, '-'], {
 encoding: 'utf8',
 maxBuffer: 8 * 1024 * 1024,
 });
 } catch {
 text = '';
 }
 } else if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
 text = `Visual source: ${baseName}`;
 } else if (ext === '.json') {
 const raw = fs.readFileSync(filePath, 'utf8');
 text = flattenChatJson(raw) || raw;
 } else {
 text = fs.readFileSync(filePath, 'utf8');
 }

 text = cleanText(text);
 const title = deriveTitle(text, baseName);
 const bullets = deriveBullets(text);
 const excerpt = deriveExcerpt(text, bullets);
 const category = deriveCategory(text, title);
 const slug = slugify(title);

 return { title, excerpt, category, slug, bullets, text, sourceName: path.basename(filePath) };
}

function flattenChatJson(raw) {
 try {
 const data = JSON.parse(raw);
 const msgs = data.messages || data.mapping || data.chat_messages || [];
 if (Array.isArray(msgs)) {
 return msgs
 .map((m) => {
 const role = m.role || m.author?.role || '';
 const content =
 typeof m.content === 'string'
 ? m.content
 : m.content?.parts?.join?.('\n') || m.text || '';
 return content ? `${role}: ${content}` : '';
 })
 .filter(Boolean)
 .join('\n\n');
 }
 if (data.mapping && typeof data.mapping === 'object') {
 return Object.values(data.mapping)
 .map((n) => n?.message?.content?.parts?.join?.('\n') || '')
 .filter(Boolean)
 .join('\n\n');
 }
 } catch {
 return '';
 }
 return '';
}

function cleanText(text) {
 return String(text || '')
 .replace(/\u0000/g, '')
 .replace(/\r/g, '')
 .replace(/[ \t]+\n/g, '\n')
 .replace(/\n{3,}/g, '\n\n')
 .trim();
}

function deriveTitle(text, fallback) {
 const fromFile = humanizeFilename(fallback);

 // Explicit title lines inside prompts / exports.
 const explicit = text.match(
 /(?:title|header)\s*(?:at top[^:]*)?:\s*["“]?([^"”\n]{12,90})["”]?/i,
 );
 if (explicit?.[1] && !skipTitle(explicit[1].trim())) {
 return explicit[1].trim();
 }

 const quoted = text.match(/["“]([A-Z][^"”]{11,88})["”]/);
 if (quoted?.[1] && /(hierarchy|pipeline|framework|wiki|design|system|model)/i.test(quoted[1])) {
 return quoted[1].trim();
 }

 const lines = text
 .split('\n')
 .map((l) => l.trim())
 .filter(Boolean);

 for (const line of lines.slice(0, 120)) {
 const cleaned = line
 .replace(/^#{1,6}\s+/, '')
 .replace(/^["']+|["']+$/g, '')
 .replace(/\s+/g, ' ')
 .trim();
 if (skipTitle(cleaned)) continue;
 if (
 /(hierarchy|pipeline|framework|visual wiki|environmental design|mental model|schema)/i.test(
 cleaned,
 ) &&
 /^[A-Z]/.test(cleaned) &&
 !/,\s*$/.test(cleaned)
 ) {
 return cleaned.replace(/^title:\s*/i, '');
 }
 }

 for (const line of lines.slice(0, 40)) {
 const cleaned = line
 .replace(/^#{1,6}\s+/, '')
 .replace(/^["']+|["']+$/g, '')
 .replace(/\s+/g, ' ')
 .trim();
 if (skipTitle(cleaned)) continue;
 if (!/^[A-Z]/.test(cleaned)) continue;
 if (/,\s*$/.test(cleaned) || /\bdear friends\b/i.test(cleaned)) continue;
 return cleaned;
 }

 return fromFile || 'Untitled Labs Note';
}

function humanizeFilename(fallback) {
 return String(fallback || '')
 .replace(/[_-]+/g, ' ')
 .replace(/\bchatgpt\b/gi, '')
 .replace(/\bgrok\b/gi, '')
 .replace(/\s+/g, ' ')
 .trim()
 .slice(0, 80);
}

function skipTitle(cleaned) {
 return (
 cleaned.length < 12 ||
 cleaned.length > 90 ||
 /^(you asked|grok|chatgpt|claude|gemini|user|assistant|system)\b/i.test(cleaned) ||
 /^\d{4}-\d{2}-\d{2}\b/.test(cleaned) ||
 /^\d+\s*\/\s*\d+$/.test(cleaned) ||
 /^https?:\/\//i.test(cleaned) ||
 /sharing content with you/i.test(cleaned) ||
 /create a tall vertical/i.test(cleaned) ||
 /dear friends/i.test(cleaned) ||
 /compressed visual information schemas/i.test(cleaned) ||
 /^type,/i.test(cleaned)
 );
}

function deriveBullets(text) {
 const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
 const bullets = [];

 for (const line of lines) {
 const m = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)/);
 if (m) {
 const item = m[1].replace(/\s+/g, ' ').trim();
 if (item.length >= 20 && item.length <= 160) bullets.push(item);
 }
 if (bullets.length >= 8) break;
 }

 if (bullets.length < 4) {
 const paras = text
 .split(/\n{2,}/)
 .map((p) => p.replace(/\s+/g, ' ').trim())
 .filter((p) => p.length >= 40 && p.length <= 180);
 for (const p of paras) {
 if (!bullets.includes(p)) bullets.push(p);
 if (bullets.length >= 6) break;
 }
 }

 while (bullets.length < 4) {
 bullets.push('Capture the mechanism, then package the return loop.');
 }

 return bullets.slice(0, 7);
}

function deriveExcerpt(text, bullets) {
 const para = text
 .split(/\n{2,}/)
 .map((p) => p.replace(/\s+/g, ' ').trim())
 .find((p) => p.length >= 60 && p.length <= 240);
 if (para) return para.slice(0, 220);
 return bullets[0].slice(0, 220);
}

function deriveCategory(text, title) {
 const hay = `${title}\n${text}`.toLowerCase();
 if (/\b(mental model|hierarchy|framework|pipeline|capability map|friction)\b/.test(hay)) {
 return 'Models';
 }
 if (/\b(experiment|hermes|self-hosted|prototype|middleware|openwebui)\b/.test(hay)) {
 return 'Experiments';
 }
 return 'Ideas';
}

export function slugify(input) {
 return String(input)
 .toLowerCase()
 .normalize('NFKD')
 .replace(/[^\w\s-]/g, '')
 .trim()
 .replace(/[\s_]+/g, '-')
 .replace(/-+/g, '-')
 .replace(/^-|-$/g, '')
 .slice(0, 72) || `labs-note-${Date.now()}`;
}

export function dateStamp(d = new Date()) {
 return d.toISOString().slice(0, 10);
}

export function displayDate(d = new Date()) {
 return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function shortDate(d = new Date()) {
 return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
