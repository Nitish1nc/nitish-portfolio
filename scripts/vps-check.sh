#!/usr/bin/env bash
set -euo pipefail

VPS_HOST="${VPS_HOST:-root@200.97.169.13}"

ssh "$VPS_HOST" 'bash -s' <<'REMOTE'
set -euo pipefail

echo "== Memory =="
free -h

echo "== nginx =="
systemctl is-active nginx
nginx -t

echo "== Portfolio =="
test -f /opt/nitish-portfolio/dist/index.html
stat -c "index.html updated: %y" /opt/nitish-portfolio/dist/index.html

echo "== Nitish Labs =="
if test -f /opt/nitish-labs/index.html; then
  stat -c "index.html updated: %y" /opt/nitish-labs/index.html
else
  echo "Not deployed"
fi

echo "== Nextcloud =="
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8080/status.php >/dev/null
echo "Nextcloud responds on port 8080"

echo "== Hermes =="
systemctl is-active hermes-gateway.service

echo "== Hermes WebUI =="
if systemctl list-unit-files --type=service | grep -q '^hermes-webui.service'; then
  systemctl is-active hermes-webui.service
else
  echo "Not installed"
fi

echo "== Certificates =="
if command -v certbot >/dev/null 2>&1; then
  certbot certificates
else
  echo "certbot command not found"
fi
REMOTE
