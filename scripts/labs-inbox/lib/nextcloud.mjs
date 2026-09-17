import fs from 'node:fs';
import path from 'node:path';
import { dateStamp } from './extract.mjs';

export function exportToNextcloud(config, sourcePath, slug, meta = {}) {
 if (!config.nextcloudInbox) {
 return { ok: false, reason: 'nextcloud-inbox-missing' };
 }

 const day = dateStamp();
 const destDir = path.join(config.nextcloudInbox, day, slug);
 fs.mkdirSync(destDir, { recursive: true });

 const destFile = path.join(destDir, path.basename(sourcePath));
 fs.copyFileSync(sourcePath, destFile);
 fs.writeFileSync(
 path.join(destDir, 'meta.json'),
 JSON.stringify(
 {
 ...meta,
 exportedAt: new Date().toISOString(),
 sourcePath,
 destFile,
 },
 null,
 2,
 ),
 );

 return { ok: true, destDir, destFile };
}

export function markPublishedOnNextcloud(config, inboxDir, slug) {
 if (!config.nextcloudPublished || !inboxDir) return null;
 const day = dateStamp();
 const dest = path.join(config.nextcloudPublished, day, slug);
 fs.mkdirSync(path.dirname(dest), { recursive: true });
 if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
 fs.cpSync(inboxDir, dest, { recursive: true });
 return dest;
}
