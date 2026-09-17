import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_EXT = new Set([
 '.pdf',
 '.md',
 '.markdown',
 '.txt',
 '.html',
 '.htm',
 '.docx',
 '.rtf',
 '.json',
 '.png',
 '.jpg',
 '.jpeg',
 '.webp',
 '.svg',
]);

const EXCLUDE_NAME = [
 /^screenshot/i,
 /^img_/i,
 /^photo/i,
 /^whatsapp/i,
 /^screen[-_ ]?recording/i,
 /^\.ds_store$/i,
 /^desktop\.ini$/i,
 /^googlesearch/i,
 /^google[-_ ]?search/i,
 /^investigation report/i,
 /^questions only/i,
 /interview invite/i,
];

const INCOMPLETE = [/\.crdownload$/i, /\.download$/i, /\.part$/i, /\.tmp$/i, /~$/];

/** Strong Labs signals - need ≥1. Keep narrow to avoid Downloads backfill noise. */
const SOFT_SIGNALS = [
 /nitish\s*labs/i,
 /nitishlabs/i,
 /nitishchauhan/i,
 /cognitive[- ]?os/i,
 /nitishlife/i,
 /visual\s*wiki/i,
 /wiki\s*map/i,
 /compressed\s*visual/i,
 /pinterest[-_ ]?style/i,
 /pinterest[-_ ]?visual/i,
 /environmental\s*design/i,
 /speech[- ]?first/i,
 /capability\s*(vs|versus|learning|map)/i,
 /process\s*vs\s*capability/i,
 /zero[- ]?upfront/i,
 /closed[- ]?loop/i,
 /capture\s*first,\s*decode/i,
 /\bhermes\b.*\b(openweb|middleware|webui)\b/i,
 /\b(chatgpt|grok|claude|gemini)[-_ ].{0,40}(menu|framework|pipeline|hierarchy|labs)/i,
];

const IMAGE_NAME_SIGNALS = [
 /visual/i,
 /wiki/i,
 /map/i,
 /schema/i,
 /pipeline/i,
 /hierarchy/i,
 /infographic/i,
 /pinterest/i,
 /carousel/i,
];

export function fileHash(filePath) {
 const buf = fs.readFileSync(filePath);
 return crypto.createHash('sha256').update(buf).digest('hex');
}

export function isIncompleteName(name) {
 return INCOMPLETE.some((re) => re.test(name));
}

export function classifyCandidate(filePath, { force = false, peekText = '' } = {}) {
 const name = path.basename(filePath);
 const ext = path.extname(name).toLowerCase();

 if (isIncompleteName(name)) {
 return { ok: false, reason: 'incomplete-download' };
 }
 if (!ALLOWED_EXT.has(ext)) {
 return { ok: false, reason: 'extension-not-allowed' };
 }
 if (EXCLUDE_NAME.some((re) => re.test(name))) {
 return { ok: false, reason: 'excluded-name' };
 }

 let stat;
 try {
 stat = fs.statSync(filePath);
 } catch {
 return { ok: false, reason: 'missing' };
 }
 if (!stat.isFile()) return { ok: false, reason: 'not-file' };

 const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext);
 const minSize = isImage ? 15_000 : 2_000;
 const maxSize = 40 * 1024 * 1024;
 if (stat.size < minSize) return { ok: false, reason: 'too-small' };
 if (stat.size > maxSize) return { ok: false, reason: 'too-large' };

 if (force) return { ok: true, reason: 'forced', ext, isImage, size: stat.size };

 const haystack = `${name}\n${peekText}`.slice(0, 12_000);
 const softHit = SOFT_SIGNALS.some((re) => re.test(haystack));
 const imageHit = isImage && IMAGE_NAME_SIGNALS.some((re) => re.test(name));

 if (!softHit && !imageHit) {
 return { ok: false, reason: 'no-labs-signal' };
 }

 return {
 ok: true,
 reason: softHit ? 'soft-signal' : 'image-signal',
 ext,
 isImage,
 size: stat.size,
 };
}
