#!/bin/bash
# Simple countdown timer with notification
set -euo pipefail

DURATION="${1:?Usage: ./timer.sh <duration> [message]}"
shift || true
MESSAGE="${*:-Timer done!}"

# Parse duration string (e.g., 1h30m, 5m, 30s)
SECONDS_TOTAL=0
remaining="$DURATION"
if [[ "$remaining" =~ ([0-9]+)h ]]; then SECONDS_TOTAL=$((SECONDS_TOTAL + ${BASH_REMATCH[1]} * 3600)); fi
if [[ "$remaining" =~ ([0-9]+)m ]]; then SECONDS_TOTAL=$((SECONDS_TOTAL + ${BASH_REMATCH[1]} * 60)); fi
if [[ "$remaining" =~ ([0-9]+)s ]]; then SECONDS_TOTAL=$((SECONDS_TOTAL + ${BASH_REMATCH[1]})); fi

# If just a plain number, treat as minutes
if [[ "$DURATION" =~ ^[0-9]+$ ]]; then
  SECONDS_TOTAL=$((DURATION * 60))
fi

if [ "$SECONDS_TOTAL" -eq 0 ]; then
  echo "Error: Could not parse duration '$DURATION'"
  exit 1
fi

echo "⏱️  Timer set for $DURATION ($SECONDS_TOTAL seconds)"
echo "📝 Message: $MESSAGE"
echo "⏳ Waiting..."

sleep "$SECONDS_TOTAL"

echo ""
echo "🔔 TIME'S UP! $MESSAGE"
printf '\a'  # Terminal bell

# macOS notification if available
if command -v osascript &>/dev/null; then
  osascript -e "display notification \"$MESSAGE\" with title \"Timer\" sound name \"Glass\"" 2>/dev/null || true
fi
