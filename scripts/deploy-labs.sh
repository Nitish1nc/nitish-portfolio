#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Public DNS for labs.nitishchauhan.com → 187.127.218.198
VPS_HOST="${VPS_HOST:-root@187.127.218.198}"
VPS_LABS="${VPS_LABS:-/opt/nitish-labs/}"

cd "$ROOT_DIR"

if npm run | grep -q 'labs:css'; then
  npm run labs:css
fi

# Nested Vite apps build into labs/<slug>/ (same pattern as Reality Engine).
# Reality Engine: apps/mental-models-reality-engine → labs/reality-engine (base /reality-engine/)
# Relief Valve: apps/hydraulic-crumble → labs/relief-valve (base /relief-valve/)
# Skip if the app is not installed yet. Do not abort a Labs deploy if the game
# TypeScript build is still mid-flight; keep any existing labs/<slug>/ bundle.
build_labs_app() {
  local app_dir="$1"
  local label="$2"
  if [ ! -f "${app_dir}/package.json" ]; then
    echo "Skipping ${label} build (app folder not present)"
    return 0
  fi
  if [ ! -d "${app_dir}/node_modules" ]; then
    echo "Skipping ${label} build (run npm install in ${app_dir} first)"
    return 0
  fi
  echo "Building ${label}"
  if ! (cd "$app_dir" && npm run build); then
    echo "Warning: ${label} build failed. Deploying Labs with the existing bundle if present."
  fi
}

build_labs_app "$ROOT_DIR/apps/hydraulic-crumble" "Relief Valve"

# backend/ stays on the server for parked UI experiments, not linked from the public front.
rsync -avz --delete labs/ "${VPS_HOST}:${VPS_LABS}"

ssh "$VPS_HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
# Prefer Welcome index only (do not fall back to parked field-notes HTML).
if [ -f /etc/nginx/sites-enabled/labs.nitishchauhan.com ]; then
  sed -i 's/index index.html source.html;/index index.html;/' /etc/nginx/sites-enabled/labs.nitishchauhan.com || true
fi
# Drop legacy root source.html if a parked copy exists.
if [ -f /opt/nitish-labs/backend/source-field-notes.html ] && [ -f /opt/nitish-labs/source.html ]; then
  rm -f /opt/nitish-labs/source.html
fi
nginx -t
systemctl reload nginx
REMOTE

echo "Nitish Labs deployed to https://labs.nitishchauhan.com (${VPS_HOST})"
