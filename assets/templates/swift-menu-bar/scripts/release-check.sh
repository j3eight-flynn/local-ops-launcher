#!/bin/zsh
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
swift build
./scripts/test-launcher-registry.sh
./scripts/export-active-background-registry.mjs
./scripts/build-app-bundle.sh
plutil -lint "$ROOT_DIR/dist/__APP_NAME__.app/Contents/Info.plist"
echo "Release check passed."
