#!/bin/bash
# Crypto price checker using free CoinGecko API
set -euo pipefail

CURRENCY="usd"
COINS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --currency) CURRENCY="$2"; shift 2 ;;
    *) COINS+=("$1"); shift ;;
  esac
done

if [ ${#COINS[@]} -eq 0 ]; then
  echo "Usage: ./price.sh <coin1> [coin2...] [--currency usd|eur|gbp]"
  echo "Example: ./price.sh bitcoin ethereum solana"
  exit 1
fi

IDS=$(IFS=,; echo "${COINS[*]}")
SYMBOL=$(echo "$CURRENCY" | tr '[:lower:]' '[:upper:]')

DATA=$(curl -sf "https://api.coingecko.com/api/v3/simple/price?ids=$IDS&vs_currencies=$CURRENCY&include_24hr_change=true")

echo "💰 Crypto Prices ($SYMBOL)"
echo "─────────────────────────"

for coin in "${COINS[@]}"; do
  PRICE=$(echo "$DATA" | jq -r ".\"$coin\".\"$CURRENCY\" // \"N/A\"")
  CHANGE=$(echo "$DATA" | jq -r ".\"$coin\".\"${CURRENCY}_24h_change\" // \"N/A\"")
  
  if [ "$PRICE" = "N/A" ]; then
    echo "❌ $coin: not found (use CoinGecko ID, e.g. 'bitcoin' not 'BTC')"
  else
    ARROW="📈"
    if [[ "$CHANGE" == -* ]]; then ARROW="📉"; fi
    printf "%s %-12s %s %s (%s%%)\n" "$ARROW" "$coin:" "$SYMBOL" "$PRICE" "$CHANGE"
  fi
done
