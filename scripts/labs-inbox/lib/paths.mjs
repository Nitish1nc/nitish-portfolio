import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const LABS_ROOT = path.join(REPO_ROOT, 'labs');
export const POSTS_DIR = path.join(LABS_ROOT, 'posts');
export const CONTENT_DIR = path.join(LABS_ROOT, 'content');
export const STATE_DIR = path.join(os.homedir(), '.local/share/nitish-labs-inbox');
export const CONFIG_DIR = path.join(os.homedir(), '.config/nitish-labs-inbox');
export const SEEN_PATH = path.join(STATE_DIR, 'seen.json');
export const LOG_DIR = path.join(STATE_DIR, 'logs');

export function defaultNextcloudRoot() {
 const cloud = path.join(os.homedir(), 'Library/CloudStorage');
 if (!fs.existsSync(cloud)) return null;
 const match = fs.readdirSync(cloud).find((n) => n.startsWith('Nextcloud-admin@cloud'));
 return match ? path.join(cloud, match) : null;
}

export function loadConfig() {
 const defaultsPath = path.join(__dirname, '../config.defaults.env');
 const userPath = path.join(CONFIG_DIR, 'config.env');
 const env = { ...parseEnvFile(defaultsPath), ...parseEnvFile(userPath), ...process.env };

 const ncRoot = env.NEXTCLOUD_ROOT || defaultNextcloudRoot();
 const inbox =
 env.NEXTCLOUD_INBOX ||
 (ncRoot ? path.join(ncRoot, 'NitishLabs', 'Inbox') : null);
 const published =
 env.NEXTCLOUD_PUBLISHED ||
 (ncRoot ? path.join(ncRoot, 'NitishLabs', 'Published') : null);

 return {
 downloadsDir: env.DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads'),
 pollSeconds: Number(env.POLL_SECONDS || 20),
 settleSeconds: Number(env.SETTLE_SECONDS || 5),
 autoDeploy: String(env.AUTO_DEPLOY ?? '1') !== '0',
 nextcloudInbox: inbox,
 nextcloudPublished: published,
 telegramBotToken: env.TELEGRAM_BOT_TOKEN || '',
 telegramChatId: env.TELEGRAM_CHAT_ID || '',
 };
}

function parseEnvFile(filePath) {
 if (!fs.existsSync(filePath)) return {};
 const out = {};
 for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
 const trimmed = line.trim();
 if (!trimmed || trimmed.startsWith('#')) continue;
 const i = trimmed.indexOf('=');
 if (i === -1) continue;
 const key = trimmed.slice(0, i).trim();
 let val = trimmed.slice(i + 1).trim();
 if (
 (val.startsWith('"') && val.endsWith('"')) ||
 (val.startsWith("'") && val.endsWith("'"))
 ) {
 val = val.slice(1, -1);
 }
 out[key] = val;
 }
 return out;
}

export function ensureDirs(config) {
 fs.mkdirSync(STATE_DIR, { recursive: true });
 fs.mkdirSync(LOG_DIR, { recursive: true });
 fs.mkdirSync(CONFIG_DIR, { recursive: true });
 if (config.nextcloudInbox) fs.mkdirSync(config.nextcloudInbox, { recursive: true });
 if (config.nextcloudPublished) fs.mkdirSync(config.nextcloudPublished, { recursive: true });
}
