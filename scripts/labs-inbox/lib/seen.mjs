import fs from 'node:fs';
import { SEEN_PATH } from './paths.mjs';

export function loadSeen() {
 if (!fs.existsSync(SEEN_PATH)) {
 return { hashes: {}, files: {}, minMtimeMs: null, paused: false };
 }
 try {
 const data = JSON.parse(fs.readFileSync(SEEN_PATH, 'utf8'));
 return {
 hashes: data.hashes || {},
 files: data.files || {},
 minMtimeMs: data.minMtimeMs ?? null,
 paused: Boolean(data.paused),
 };
 } catch {
 return { hashes: {}, files: {}, minMtimeMs: null, paused: false };
 }
}

export function saveSeen(seen) {
 fs.mkdirSync(pathDir(SEEN_PATH), { recursive: true });
 fs.writeFileSync(SEEN_PATH, `${JSON.stringify(seen, null, 2)}\n`);
}

/** On (re)enable: ignore anything already in Downloads; only NEW mtimes. */
export function ensureWatermark(seen, { force = false } = {}) {
 if (force || seen.minMtimeMs == null) {
 seen.minMtimeMs = Date.now();
 saveSeen(seen);
 }
 return seen.minMtimeMs;
}

export function setPaused(paused) {
 const seen = loadSeen();
 seen.paused = Boolean(paused);
 saveSeen(seen);
 return seen;
}

export function remember(seen, { hash, filePath, slug, postUrl }) {
 seen.hashes[hash] = {
 at: new Date().toISOString(),
 filePath,
 slug,
 postUrl,
 };
 seen.files[filePath] = hash;
 saveSeen(seen);
}

function pathDir(p) {
 return p.replace(/\/[^/]+$/, '');
}
