#!/bin/bash
# Simple note taker - stores notes as local text files
set -euo pipefail

NOTES_DIR="${NOTES_DIR:-$HOME/.notes}"
mkdir -p "$NOTES_DIR"

ACTION="${1:?Usage: ./notes.sh <add|list|search> [text]}"
shift || true

case "$ACTION" in
  add)
    TEXT="${*:?Provide note text}"
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    FILE="$NOTES_DIR/$(date '+%Y-%m-%d').md"
    echo "- [$TIMESTAMP] $TEXT" >> "$FILE"
    echo "✅ Note saved to $FILE"
    ;;
  list)
    if [ -z "$(ls -A "$NOTES_DIR" 2>/dev/null)" ]; then
      echo "No notes yet."
    else
      for f in "$NOTES_DIR"/*.md; do
        [ -f "$f" ] && echo "=== $(basename "$f") ===" && cat "$f" && echo
      done
    fi
    ;;
  search)
    QUERY="${*:?Provide search query}"
    grep -rn -i "$QUERY" "$NOTES_DIR" 2>/dev/null || echo "No matches found."
    ;;
  *)
    echo "Usage: ./notes.sh <add|list|search> [text]"
    exit 1
    ;;
esac
