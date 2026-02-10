#!/bin/bash
# Serve bilingual Rust book with hot reload
# Usage: ./serve.sh [port]
# Default port: 8000

set -e

PORT="${1:-8000}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOOK_OUT="$SCRIPT_DIR/book"

# Cleanup on exit
cleanup() {
  echo ""
  echo "=== Shutting down ==="
  [ -n "$WATCH_EN_PID" ] && kill "$WATCH_EN_PID" 2>/dev/null
  [ -n "$WATCH_ZH_PID" ] && kill "$WATCH_ZH_PID" 2>/dev/null
  cd "$SCRIPT_DIR/rust-book-src"
  git checkout -- book.toml 2>/dev/null
  rm -f lang-switch.js last-updated-data.js last-updated.js
  echo "Done."
}
trap cleanup EXIT

# === Initial build ===
echo "=== Building bilingual book ==="
bash "$SCRIPT_DIR/build.sh"

# === Inject shared JS for watch mode ===
cd "$SCRIPT_DIR/rust-book-src"
cp "$SCRIPT_DIR/lang-switch.js" .
cp "$SCRIPT_DIR/rust-book-cn/last-updated-data.js" .
cp "$SCRIPT_DIR/rust-book-cn/last-updated.js" .
sed -i 's/additional-js = \["ferris.js"\]/additional-js = ["ferris.js", "lang-switch.js", "last-updated-data.js", "last-updated.js"]/' book.toml

# === Start file watchers (auto-rebuild on source changes) ===
echo "=== Starting file watchers ==="
cd "$SCRIPT_DIR/rust-book-src"
mdbook watch -d "$BOOK_OUT/en" &
WATCH_EN_PID=$!

cd "$SCRIPT_DIR/rust-book-cn"
mdbook watch -d "$BOOK_OUT/zh" &
WATCH_ZH_PID=$!

# === Start browser-sync with hot reload ===
# browser-sync watches output files and auto-refreshes browser
# Access URLs will be printed by browser-sync (append /zh/ or /en/ to visit)
echo ""
echo "=== Starting hot-reload server (Ctrl+C to stop) ==="

cd "$SCRIPT_DIR"
npx browser-sync start \
  --server "$BOOK_OUT" \
  --files "$BOOK_OUT/en/**/*" "$BOOK_OUT/zh/**/*" \
  --port "$PORT" \
  --no-open \
  --no-notify
