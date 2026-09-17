import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import { LOG_DIR } from './paths.mjs';

export async function notifyPublished({ config, result }) {
 const title = 'NitishLabs published';
 const body = result.deployed
 ? `${result.postMeta.title}\n${result.postUrl}`
 : `${result.postMeta.title} (local only - deploy failed)\n${result.postUrl}`;

 macNotify(title, body);
 appendLog(`${new Date().toISOString()} PUBLISHED ${result.slug} deployed=${result.deployed} ${result.postUrl}`);

 if (config.telegramBotToken && config.telegramChatId) {
 await telegramSend(
 config.telegramBotToken,
 config.telegramChatId,
 `Labs idea published\n\n${result.postMeta.title}\n${result.url}\n${result.postUrl}`,
 );
 }
}

export function macNotify(title, body) {
 const script = `display notification ${jsonApple(body)} with title ${jsonApple(title)} sound name "Glass"`;
 try {
 execFileSync('osascript', ['-e', script], { stdio: 'ignore' });
 } catch {
 // non-fatal
 }
}

function jsonApple(s) {
 return JSON.stringify(String(s).slice(0, 180));
}

function telegramSend(token, chatId, text) {
 const payload = JSON.stringify({
 chat_id: chatId,
 text,
 disable_web_page_preview: false,
 });
 return new Promise((resolve) => {
 const req = https.request(
 {
 hostname: 'api.telegram.org',
 path: `/bot${token}/sendMessage`,
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Content-Length': Buffer.byteLength(payload),
 },
 },
 (res) => {
 res.resume();
 resolve();
 },
 );
 req.on('error', () => resolve());
 req.write(payload);
 req.end();
 });
}

function appendLog(line) {
 fs.mkdirSync(LOG_DIR, { recursive: true });
 fs.appendFileSync(`${LOG_DIR}/watcher.log`, `${line}\n`);
}
