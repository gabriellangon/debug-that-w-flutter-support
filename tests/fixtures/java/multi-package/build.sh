#!/usr/bin/env bash
# Compile both modules with correct classpath
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/out"
rm -rf "$OUT"
mkdir -p "$OUT"

# Compile lib first
javac -d "$OUT" "$DIR/lib/src/main/java/com/example/lib/Util.java"

# Compile app with lib on classpath
javac -d "$OUT" -cp "$OUT" "$DIR/app/src/main/java/com/example/app/App.java"
