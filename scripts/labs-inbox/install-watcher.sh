#!/usr/bin/env bash
# Install / unload the NitishLabs Downloads watcher (launchd).
# On install: clears pause flag and sets a fresh mtime watermark (no Downloads backfill).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="com.nitish.labs-downloads-watcher"
PLIST_SRC="$ROOT_DIR/ops/launchd/${LABEL}.plist"
PLIST_DST="$HOME/Library/LaunchAgents/${LABEL}.plist"
CONFIG_DIR="$HOME/.config/nitish-labs-inbox"
STATE_DIR="$HOME/.local/share/nitish-labs-inbox"

mkdir -p "$HOME/Library/LaunchAgents" "$CONFIG_DIR" "$STATE_DIR/logs"
cd "$ROOT_DIR"

if [[ ! -f "$CONFIG_DIR/config.env" ]]; then
  cp "$ROOT_DIR/scripts/labs-inbox/config.defaults.env" "$CONFIG_DIR/config.env"
  echo "Wrote $CONFIG_DIR/config.env"
fi

NODE_BIN="$(command -v node)"
if [[ -z "$NODE_BIN" ]]; then
  echo "node not found in PATH" >&2
  exit 1
fi

# Clear pause + set watermark to now (ignore historical Downloads).
"$NODE_BIN" --input-type=module <<'EOF'
import { loadSeen, saveSeen, ensureWatermark, setPaused } from './scripts/labs-inbox/lib/seen.mjs';
setPaused(false);
const seen = loadSeen();
ensureWatermark(seen, { force: true });
saveSeen(seen);
console.log(`watermark=${new Date(seen.minMtimeMs).toISOString()} paused=false`);
EOF

# Render plist with absolute paths for this machine.
sed \
  -e "s|__NODE__|${NODE_BIN}|g" \
  -e "s|__REPO__|${ROOT_DIR}|g" \
  -e "s|__HOME__|${HOME}|g" \
  "$PLIST_SRC" > "$PLIST_DST"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"
launchctl enable "gui/$(id -u)/$LABEL"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "Installed $LABEL"
echo "  plist:  $PLIST_DST"
echo "  config: $CONFIG_DIR/config.env"
echo "  logs:   $STATE_DIR/logs/watcher.log"
echo "  conditions: $ROOT_DIR/scripts/labs-inbox/CONDITIONS.md"
echo
echo "Optional Telegram: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in config.env"
echo "Pause later: bash scripts/labs-inbox/pause-watcher.sh"
