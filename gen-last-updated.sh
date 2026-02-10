#!/bin/bash
# Generate last-updated-data.js from git history
# Usage: ./gen-last-updated.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$SCRIPT_DIR/rust-book-cn/last-updated-data.js"

echo "Generating $OUT ..."

cd "$SCRIPT_DIR"

{
  printf 'window.LAST_UPDATED_DATA = {\n'
  first=true
  for file in "$SCRIPT_DIR"/rust-book-cn/src/*.md; do
    filename=$(basename "$file")
    date=$(git log -1 --format=%cd --date=short -- "$file" 2>/dev/null)
    [ -z "$date" ] && continue
    if [ "$first" = true ]; then
      first=false
    else
      printf ',\n'
    fi
    printf '  "%s": "%s"' "$filename" "$date"
  done
  printf '\n};\n'
} > "$OUT"

echo "Done."
