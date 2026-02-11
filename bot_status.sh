#!/bin/bash
###############################################################################
# Polymarket Autonomous Bot - Status Checker
###############################################################################

BOT_DIR="/Users/erik/.openclaw/workspace"
PID_FILE="$BOT_DIR/.bot.pid"
LOG_FILE="$BOT_DIR/bot_output.log"
TODAY=$(date +%Y-%m-%d)
STATS_FILE="$BOT_DIR/.bot_stats_$TODAY.json"

echo "📊 POLYMARKET BOT STATUS"
echo "========================"
echo ""

# Check if running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ Status: RUNNING"
        echo "   PID: $PID"
        
        # Get memory usage
        MEM=$(ps -p "$PID" -o rss= | awk '{printf "%.1f MB", $1/1024}')
        echo "   Memory: $MEM"
        
        # Get uptime
        START_TIME=$(ps -p "$PID" -o lstart=)
        echo "   Started: $START_TIME"
    else
        echo "❌ Status: NOT RUNNING (stale PID file)"
    fi
else
    echo "❌ Status: NOT RUNNING"
fi

echo ""

# Show today's stats
if [ -f "$STATS_FILE" ]; then
    echo "📈 TODAY'S PERFORMANCE:"
    python3 << EOF
import json
try:
    with open('$STATS_FILE') as f:
        stats = json.load(f)
    print(f"   Trades: {stats['total_trades']}")
    print(f"   Wins: {stats['winning_trades']}")
    if stats['total_trades'] > 0:
        wr = stats['winning_trades'] / stats['total_trades'] * 100
        print(f"   Win Rate: {wr:.1f}%")
    print(f"   P&L: \${stats['total_pnl']:.2f}")
    print(f"   Consecutive Losses: {stats['consecutive_losses']}")
    if stats['paused']:
        print(f"   ⚠️  PAUSED: {stats['pause_reason']}")
except:
    print("   (Unable to load stats)")
EOF
else
    echo "📈 TODAY'S PERFORMANCE:"
    echo "   No trades yet today"
fi

echo ""
echo "📝 Recent Log (last 10 lines):"
if [ -f "$LOG_FILE" ]; then
    tail -10 "$LOG_FILE" | sed 's/^/   /'
else
    echo "   (No log file)"
fi

echo ""
echo "💡 Commands:"
echo "   Start:   ./start_bot.sh"
echo "   Stop:    ./stop_bot.sh"
echo "   Logs:    tail -f $LOG_FILE"
