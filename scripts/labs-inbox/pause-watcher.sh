#!/usr/bin/env bash
# Pause the NitishLabs Downloads watcher (unload launchd + mark paused).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="com.nitish.labs-downloads-watcher"
STATE_DIR="$HOME/.local/share/nitish-labs-inbox"

mkdir -p "$STATE_DIR"
cd "$ROOT_DIR"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl disable "gui/$(id -u)/$LABEL" 2>/dev/null || true

node --input-type=module <<'EOF'
import { setPaused, ensureWatermark, loadSeen, saveSeen } from './scripts/labs-inbox/lib/seen.mjs';
setPaused(true);
const seen = loadSeen();
// Keep existing watermark; if missing, set so a mistaken start still won't backfill.
ensureWatermark(seen, { force: false });
saveSeen(seen);
console.log(`seen.json paused=true minMtime=${seen.minMtimeMs ? new Date(seen.minMtimeMs).toISOString() : 'null'}`);
EOF

echo "Paused $LABEL"
echo "  Re-enable after review: npm run labs:watch:install"
echo "  Conditions: $ROOT_DIR/scripts/labs-inbox/CONDITIONS.md"
