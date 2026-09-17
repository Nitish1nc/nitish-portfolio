#!/usr/bin/env node
/**
 * NitishLabs Downloads watcher
 *
 * Regularly scans ~/Downloads for Labs-candidate files, exports them to
 * Nextcloud NitishLabs/Inbox, publishes to labs.nitishchauhan.com/ideas with a
 * mandatory Visual Wiki Map LinkedIn carousel, then notifies.
 *
 * Usage:
 * node scripts/labs-inbox/watch-and-publish.mjs # loop
 * node scripts/labs-inbox/watch-and-publish.mjs --once # single scan
 * node scripts/labs-inbox/watch-and-publish.mjs --file /path/to/file
 */
import fs from 'node:fs';
import path from 'node:path';
import { classifyCandidate, fileHash, isIncompleteName } from './lib/classify.mjs';
import { extractDocument, peekText } from './lib/extract.mjs';
import { exportToNextcloud, markPublishedOnNextcloud } from './lib/nextcloud.mjs';
import { notifyPublished, macNotify } from './lib/notify.mjs';
import { ensureDirs, loadConfig, LOG_DIR } from './lib/paths.mjs';
import { publishIdea } from './lib/publish.mjs';
import { loadSeen, remember, ensureWatermark } from './lib/seen.mjs';

const args = process.argv.slice(2);
const once = args.includes('--once');
const fileIdx = args.indexOf('--file');
const forceFile = fileIdx >= 0 ? args[fileIdx + 1] : null;
const resetWatermark = args.includes('--reset-watermark');

const settleMap = new Map();

async function main() {
 const config = loadConfig();
 ensureDirs(config);
 const seen = loadSeen();

 if (seen.paused && !forceFile) {
 log('watcher is PAUSED (seen.json paused=true). Exiting. Review CONDITIONS.md before re-enable.');
 process.exit(0);
 }

 // Never backfill historical Downloads - only files newer than watermark.
 ensureWatermark(seen, { force: resetWatermark });
 log(
 `watcher start downloads=${config.downloadsDir} poll=${config.pollSeconds}s minMtime=${new Date(seen.minMtimeMs).toISOString()}`,
 );

 if (forceFile) {
 await processPath(forceFile, config, { force: true });
 return;
 }

 if (once) {
 await scan(config);
 return;
 }

 // Initial scan, then poll.
 await scan(config);
 setInterval(() => {
 scan(config).catch((err) => log(`scan error: ${err.message}`));
 }, config.pollSeconds * 1000);
}

async function scan(config) {
 const dir = config.downloadsDir;
 if (!fs.existsSync(dir)) {
 log(`downloads missing: ${dir}`);
 return;
 }

 const seen = loadSeen();
 const minMtime = seen.minMtimeMs ?? 0;

 const names = fs.readdirSync(dir);
 for (const name of names) {
 if (name.startsWith('.')) continue;
 if (isIncompleteName(name)) continue;
 const full = path.join(dir, name);
 let stat;
 try {
 stat = fs.statSync(full);
 } catch {
 continue;
 }
 if (!stat.isFile()) continue;

 // Skip anything that existed before watcher (re)enable.
 if (stat.mtimeMs < minMtime) continue;

 const key = full;
 const prev = settleMap.get(key);
 if (!prev || prev.size !== stat.size || prev.mtimeMs !== stat.mtimeMs) {
 settleMap.set(key, {
 size: stat.size,
 mtimeMs: stat.mtimeMs,
 since: Date.now(),
 });
 continue;
 }
 if (Date.now() - prev.since < config.settleSeconds * 1000) continue;

 await processPath(full, config, { force: false });
 settleMap.delete(key);
 }
}

async function processPath(filePath, config, { force }) {
 const seen = loadSeen();
 let hash;
 try {
 hash = fileHash(filePath);
 } catch (err) {
 log(`hash fail ${filePath}: ${err.message}`);
 return;
 }
 if (seen.hashes[hash]) {
 return;
 }

 const peek = peekText(filePath);
 const verdict = classifyCandidate(filePath, { force, peekText: peek });
 if (!verdict.ok) {
 if (force) log(`reject ${path.basename(filePath)}: ${verdict.reason}`);
 return;
 }

 log(`candidate ${path.basename(filePath)} (${verdict.reason})`);

 let doc;
 try {
 doc = extractDocument(filePath);
 } catch (err) {
 log(`extract fail: ${err.message}`);
 macNotify('NitishLabs inbox', `Extract failed: ${path.basename(filePath)}`);
 return;
 }

 const nc = exportToNextcloud(config, filePath, doc.slug, {
 title: doc.title,
 category: doc.category,
 reason: verdict.reason,
 });
 if (!nc.ok) log(`nextcloud skip: ${nc.reason}`);

 const isImage = verdict.isImage;
 let result;
 try {
 result = publishIdea({
 doc,
 sourcePath: filePath,
 config,
 sourceImagePath: isImage ? filePath : null,
 });
 } catch (err) {
 log(`publish fail: ${err.message}`);
 macNotify('NitishLabs inbox', `Publish failed: ${doc.title}`);
 return;
 }

 if (nc.ok) {
 markPublishedOnNextcloud(config, nc.destDir, result.slug);
 fs.writeFileSync(
 path.join(nc.destDir, 'published.json'),
 JSON.stringify(
 {
 slug: result.slug,
 postUrl: result.postUrl,
 ideasUrl: result.url,
 deployed: result.deployed,
 at: new Date().toISOString(),
 },
 null,
 2,
 ),
 );
 }

 remember(seen, {
 hash,
 filePath,
 slug: result.slug,
 postUrl: result.postUrl,
 });

 await notifyPublished({ config, result });
 log(
 `published ${result.slug} deployed=${result.deployed}${result.deployError ? ` err=${String(result.deployError).slice(0, 120)}` : ''}`,
 );
}

function log(msg) {
 const line = `${new Date().toISOString()} ${msg}`;
 console.log(line);
 try {
 fs.mkdirSync(LOG_DIR, { recursive: true });
 fs.appendFileSync(path.join(LOG_DIR, 'watcher.log'), `${line}\n`);
 } catch {
 // ignore
 }
}

main().catch((err) => {
 console.error(err);
 process.exit(1);
});
