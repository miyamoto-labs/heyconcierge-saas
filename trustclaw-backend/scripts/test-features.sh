#!/bin/bash

# Quick test script for TrustClaw growth features

echo "🧪 Testing TrustClaw Growth Features"
echo ""

# ── Test 1: External Scan API Documentation ──
echo "1️⃣ Testing External Scan API (GET /api/scan/external)"
echo "   Should return API documentation..."
echo ""
curl -s http://localhost:3000/api/scan/external | jq -r '.description' 2>/dev/null || echo "   ⚠️ Server not running or jq not installed"
echo ""

# ── Test 2: GitHub Crawler (Dry Run) ──
echo "2️⃣ Testing GitHub Crawler (dry run, limited to 5 results)"
echo "   This will search GitHub but NOT add to database..."
echo ""
cd "$(dirname "$0")/.." || exit
tsx scripts/github-crawler.ts --dry-run --limit=5
echo ""

# ── Test 3: Verify Files Exist ──
echo "3️⃣ Verifying all files created:"
files=(
  "src/app/api/scan/external/route.ts"
  "scripts/github-crawler.ts"
  "../trustclaw-marketing/discord-outreach.md"
  "GROWTH_FEATURES.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file (MISSING)"
  fi
done

echo ""
echo "✨ Test complete! Check GROWTH_FEATURES.md for full documentation."
