#!/bin/bash
# Bot monitoring script for V2.4

echo "=== HYPERLIQUID BOT V2.4 MONITOR ==="
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Check if bot is running
PID=$(ps aux | grep "hyperliquid_bot_v2_optimized.py" | grep -v grep | awk '{print $2}')
if [ -z "$PID" ]; then
    echo "❌ BOT NOT RUNNING!"
    exit 1
fi
echo "✅ Bot running (PID: $PID)"

# Show recent log activity
echo ""
echo "=== RECENT ACTIVITY ==="
tail -50 /tmp/hyperliquid_bot_v2.4.log | grep -E "(💼 PAPER|🚨|Stats:|EXECUTING|Signal Generation)"

# Show state
echo ""
echo "=== BOT STATE ==="
cat /Users/erik/.openclaw/workspace/scalping_state_v2.json | python3 -m json.tool | grep -E "(daily_pnl|daily_trades|winning_trades|losing_trades|open_positions)"

echo ""
echo "=== END MONITOR ==="
