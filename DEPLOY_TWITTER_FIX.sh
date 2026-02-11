#!/bin/bash
# Quick deployment script for Twitter bot fixes
# Run this to deploy all changes

echo "🚀 MIYAMOTO LABS - Twitter Bot Deployment"
echo "=========================================="
echo ""

# Set working directory
cd /Users/erik/.openclaw/workspace

# Make scripts executable
echo "📝 Making scripts executable..."
chmod +x crypto_twitter_bot_v2.py
chmod +x afternoon_insight_tweet.py
chmod +x daily_crypto_tweet.py
chmod +x daily_promo_tweet.py

echo "✅ Scripts are executable"
echo ""

# Test engagement bot (dry run)
echo "🧪 Testing engagement bot (dry run)..."
echo "This will take 1-2 minutes..."
echo ""
python3 crypto_twitter_bot_v2.py --dry-run
echo ""

# Ask to proceed with live test
echo "=========================================="
echo "📋 DRY RUN COMPLETE"
echo ""
echo "Ready to test LIVE?"
echo "⚠️  This will post 2-4 real replies/likes to Twitter"
echo ""
read -p "Continue with LIVE test? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔴 LIVE TEST - Running engagement bot..."
    python3 crypto_twitter_bot_v2.py
    echo ""
    
    echo "✅ Live test complete!"
    echo ""
    echo "📊 Check Twitter to verify:"
    echo "   1. Replies were posted"
    echo "   2. Likes were registered"
    echo "   3. No error messages"
    echo ""
    echo "⏰ Wait 2 hours, then check for blocks/rate limits"
    echo ""
    
    read -p "Did the bot work without errors? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🎉 SUCCESS! Ready to schedule via cron"
        echo ""
        echo "Add these to your crontab (crontab -e):"
        echo ""
        echo "# Twitter automation - MIYAMOTO LABS"
        echo "# Daily market tweet (9 AM Oslo = 8 AM UTC)"
        echo "0 8 * * * cd /Users/erik/.openclaw/workspace && python3 daily_crypto_tweet.py >> /tmp/twitter_market.log 2>&1"
        echo ""
        echo "# Daily insight tweet (2 PM Oslo = 1 PM UTC)"
        echo "0 13 * * * cd /Users/erik/.openclaw/workspace && python3 afternoon_insight_tweet.py >> /tmp/twitter_insight.log 2>&1"
        echo ""
        echo "# Daily promo tweet (8 PM Oslo = 7 PM UTC)"
        echo "0 19 * * * cd /Users/erik/.openclaw/workspace && python3 daily_promo_tweet.py >> /tmp/twitter_promo.log 2>&1"
        echo ""
        echo "# Engagement bot (every 8 hours)"
        echo "0 */8 * * * cd /Users/erik/.openclaw/workspace && python3 crypto_twitter_bot_v2.py >> /tmp/twitter_engagement.log 2>&1"
        echo ""
        echo "📝 Copy-paste the above into: crontab -e"
    else
        echo "❌ Bot encountered errors. Check:"
        echo "   1. Twitter error message"
        echo "   2. Rate limits (429 error)"
        echo "   3. Account blocks (403 error)"
        echo ""
        echo "💡 Wait 24h before retrying if blocked"
    fi
else
    echo "⏸️  Deployment paused. Run this script again when ready."
fi

echo ""
echo "📚 Documentation:"
echo "   - Strategy: TWITTER_GROWTH_STRATEGY.md"
echo "   - Fix Report: TWITTER_BOT_FIX_REPORT.md"
echo "   - Bot code: crypto_twitter_bot_v2.py"
echo ""
echo "✨ Done!"
