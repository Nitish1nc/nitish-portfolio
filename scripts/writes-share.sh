#!/usr/bin/env bash
# @raycast.schemaVersion 1
# @raycast.title Publish to Writes
# @raycast.mode compact
# @raycast.packageName Nitish
# @raycast.description Frontmost markdown file: first image is the share preview, rest is the article on nitishchauhan.com/writes
# @raycast.author Nitish Chauhan
# @raycast.argument1 { "type": "text", "placeholder": "Path to .md file", "optional": false }

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NOTE="${1:-}"
if [[ -z "$NOTE" ]]; then
  echo "Pass the markdown file path (Raycast: drop this script in Script Commands, argument = file path)."
  exit 2
fi
if [[ "$NOTE" != /* ]]; then
  NOTE="$(pwd)/$NOTE"
fi
if [[ ! -f "$NOTE" ]]; then
  echo "Not found: $NOTE"
  exit 1
fi
cd "$ROOT"
exec node "$ROOT/scripts/writes-publish.mjs" "$NOTE" --push --force
