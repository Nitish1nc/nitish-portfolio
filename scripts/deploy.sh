#!/usr/bin/env bash
# GitHub Actions (.github/workflows/deploy.yml) mirrors this path on push
# to master/main: vite build, rsync dist/ to the VPS, nginx reload.
# CI skips writes:og (Playwright). Local deploys still generate OG images.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VPS_HOST="${VPS_HOST:-root@187.127.218.198}"
VPS_DIST="${VPS_DIST:-/opt/nitish-portfolio/dist/}"

cd "$ROOT_DIR"
npm run writes:og || echo "writes:og skipped"
npm run build
rsync -avz --delete dist/ "${VPS_HOST}:${VPS_DIST}"
ssh "$VPS_HOST" 'nginx -t && systemctl reload nginx'

echo "Portfolio deployed to https://www.nitishchauhan.com"
