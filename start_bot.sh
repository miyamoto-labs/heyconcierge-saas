#!/bin/bash
###############################################################################
# Polymarket Autonomous Bot - Startup Script
# Erik: Run this to start the bot in the background
###############################################################################

BOT_DIR="/Users/erik/.openclaw/workspace"
BOT_SCRIPT="polymarket_autonomous_trader.py"
LOG_FILE="$BOT_DIR/bot_output.log"
PID_FILE="$BOT_DIR/.bot.pid"

cd "$BOT_DIR" || exit 1

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Bot is already running (PID: $PID)"
        echo "   To stop: ./stop_bot.sh"
        exit 1
    fi
fi

echo "🚀 Starting Polymarket Autonomous Bot..."
echo "📁 Working directory: $BOT_DIR"
echo "📝 Log file: $LOG_FILE"
echo ""

# Start bot in background
nohup python3 "$BOT_SCRIPT" >> "$LOG_FILE" 2>&1 &
BOT_PID=$!

# Save PID
echo "$BOT_PID" > "$PID_FILE"

# Wait a moment to check it started
sleep 2

if ps -p "$BOT_PID" > /dev/null 2>&1; then
    echo "✅ Bot started successfully!"
    echo "   PID: $BOT_PID"
    echo ""
    echo "📊 To monitor:"
    echo "   tail -f $LOG_FILE"
    echo ""
    echo "🛑 To stop:"
    echo "   ./stop_bot.sh"
    echo ""
    echo "📱 Check Telegram for trade alerts!"
else
    echo "❌ Bot failed to start. Check log:"
    echo "   cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
