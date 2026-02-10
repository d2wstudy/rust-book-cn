#!/bin/bash
# Build bilingual Rust book
# Usage: ./build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOOK_OUT="$SCRIPT_DIR/book"

echo "=== Cleaning output directory ==="
rm -rf "$BOOK_OUT"
mkdir -p "$BOOK_OUT"

echo "=== Preparing English version ==="
cd "$SCRIPT_DIR/rust-book-src"
# Inject lang-switch.js into submodule before building
cp "$SCRIPT_DIR/lang-switch.js" .
sed -i 's/additional-js = \["ferris.js"\]/additional-js = ["ferris.js", "lang-switch.js"]/' book.toml

echo "=== Building English version ==="
mdbook build -d "$BOOK_OUT/en"

# Restore submodule to clean state
git checkout -- book.toml
rm -f lang-switch.js

echo "=== Building Chinese version ==="
cd "$SCRIPT_DIR/rust-book-cn"
mdbook build -d "$BOOK_OUT/zh"

echo "=== Creating index redirect ==="
cat > "$BOOK_OUT/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>The Rust Programming Language</title>
  <script>
    var lang = navigator.language || navigator.userLanguage || "en";
    if (lang.startsWith("zh")) {
      window.location.href = "./zh/index.html";
    } else {
      window.location.href = "./en/index.html";
    }
  </script>
</head>
<body>
  <p>Redirecting...</p>
  <p><a href="./en/index.html">English</a> | <a href="./zh/index.html">中文</a></p>
</body>
</html>
HTMLEOF

echo "=== Build complete ==="
echo "Output: $BOOK_OUT/"
echo "  English: $BOOK_OUT/en/"
echo "  Chinese: $BOOK_OUT/zh/"
