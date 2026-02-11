#!/bin/bash
# Continuous monitoring - run for 1 hour

LOG_FILE="/tmp/bot_monitor_$(date +%Y%m%d_%H%M%S).log"
echo "Starting 1-hour monitor... Logging to $LOG_FILE"

for i in {1..12}; do
    echo "=== CHECK $i/12 - $(date '+%H:%M:%S') ===" | tee -a "$LOG_FILE"
    
    # Check if bot is running
    PID=$(ps aux | grep "hyperliquid_bot_v2_optimized.py" | grep -v grep | awk '{print $2}')
    if [ -z "$PID" ]; then
        echo "❌ BOT CRASHED!" | tee -a "$LOG_FILE"
        exit 1
    fi
    
    # Get state
    STATE=$(cat /Users/erik/.openclaw/workspace/scalping_state_v2.json)
    TRADES=$(echo "$STATE" | python3 -c "import sys, json; print(json.load(sys.stdin)['daily_trades'])")
    PNL=$(echo "$STATE" | python3 -c "import sys, json; print(json.load(sys.stdin)['daily_pnl'])")
    WINS=$(echo "$STATE" | python3 -c "import sys, json; print(json.load(sys.stdin)['winning_trades'])")
    LOSSES=$(echo "$STATE" | python3 -c "import sys, json; print(json.load(sys.stdin)['losing_trades'])")
    
    echo "Trades: $TRADES | P&L: \$$PNL | W/L: $WINS/$LOSSES" | tee -a "$LOG_FILE"
    
    # Show last position update
    tail -100 /tmp/hyperliquid_bot_v2.4.log | grep "💼 PAPER" | tail -1 | tee -a "$LOG_FILE"
    
    echo "" | tee -a "$LOG_FILE"
    
    # Sleep for 5 minutes
    sleep 300
done

echo "Monitor complete. Check $LOG_FILE for full history."
