#!/bin/bash
###############################################################################
# Polymarket Autonomous Bot - Stop Script
###############################################################################

PID_FILE="/Users/erik/.openclaw/workspace/.bot.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  Bot PID file not found. Bot may not be running."
    echo "   Checking for orphan processes..."
    
    # Try to find and kill any running bot processes
    PIDS=$(ps aux | grep "polymarket_autonomous_trader.py" | grep -v grep | awk '{print $2}')
    
    if [ -z "$PIDS" ]; then
        echo "✅ No bot processes found."
        exit 0
    else
        echo "🔍 Found bot processes: $PIDS"
        for PID in $PIDS; do
            echo "   Killing PID $PID..."
            kill "$PID" 2>/dev/null
        done
        echo "✅ Orphan processes terminated."
        exit 0
    fi
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "🛑 Stopping bot (PID: $PID)..."
    kill "$PID"
    
    # Wait for graceful shutdown
    sleep 3
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Graceful shutdown failed. Force killing..."
        kill -9 "$PID"
        sleep 1
    fi
    
    rm -f "$PID_FILE"
    echo "✅ Bot stopped successfully."
else
    echo "⚠️  Bot not running (stale PID file)."
    rm -f "$PID_FILE"
fi
