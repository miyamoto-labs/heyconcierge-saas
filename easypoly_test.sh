#!/bin/bash
# EasyPoly Launch Validation Test

echo "🧪 EasyPoly Launch Validation"
echo "=============================="
echo ""

# Test 1: Landing page
echo "📋 Test 1: Landing page accessibility"
LANDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://easypoly.lol)
if [ "$LANDING_STATUS" = "200" ]; then
  echo "✅ Landing page: UP ($LANDING_STATUS)"
else
  echo "❌ Landing page: DOWN ($LANDING_STATUS)"
fi

# Test 2: Connect page
echo ""
echo "📋 Test 2: Connect page accessibility"
CONNECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://easypoly.lol/connect?user_id=123456")
if [ "$CONNECT_STATUS" = "200" ]; then
  echo "✅ Connect page: UP ($CONNECT_STATUS)"
else
  echo "❌ Connect page: DOWN ($CONNECT_STATUS)"
fi

# Test 3: Bot API
echo ""
echo "📋 Test 3: Bot API health"
BOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://easypoly-bot-production.up.railway.app)
if [ "$BOT_STATUS" = "200" ]; then
  echo "✅ Bot API: UP ($BOT_STATUS)"
  BOT_RESPONSE=$(curl -s https://easypoly-bot-production.up.railway.app)
  echo "   Response: $BOT_RESPONSE"
else
  echo "❌ Bot API: DOWN ($BOT_STATUS)"
fi

# Test 4: Callback endpoint
echo ""
echo "📋 Test 4: Callback endpoint"
CALLBACK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://easypoly-bot-production.up.railway.app/callback/wallet -H "Content-Type: application/json" -d '{}')
if [ "$CALLBACK_STATUS" = "400" ]; then
  echo "✅ Callback endpoint: UP (returns 400 for missing fields as expected)"
elif [ "$CALLBACK_STATUS" = "200" ]; then
  echo "⚠️  Callback endpoint: UP but accepted empty payload (check validation)"
else
  echo "❌ Callback endpoint: ERROR ($CALLBACK_STATUS)"
fi

# Test 5: Trader service
echo ""
echo "📋 Test 5: Trader service (local)"
TRADER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null)
if [ "$TRADER_STATUS" = "200" ]; then
  echo "✅ Trader service: UP ($TRADER_STATUS)"
else
  echo "⚠️  Trader service: Not accessible via localhost (may need Cloudflare tunnel URL)"
fi

# Test 6: Database
echo ""
echo "📋 Test 6: Database file"
if [ -f "/data/easypoly.db" ]; then
  DB_SIZE=$(du -h /data/easypoly.db | cut -f1)
  echo "✅ Database exists: /data/easypoly.db ($DB_SIZE)"
else
  echo "⚠️  Database not found at /data/easypoly.db (may be in Railway container)"
fi

echo ""
echo "=============================="
echo "🎯 Validation Summary"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. Test with real Telegram bot (@EasyPolyBot)"
echo "2. Send /start and verify 'Connect Wallet' button appears"
echo "3. Click button and complete credential flow"
echo "4. Verify /wallet command shows connected status"
echo "5. Test placing a bet with real Polymarket credentials"
echo ""
echo "Launch checklist: /Users/erik/.openclaw/workspace/EASYPOLY_LAUNCH.md"
