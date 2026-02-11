# HEARTBEAT.md

# Bot monitoring: Hyperliquid Funding Rate Bot only
# Cron job ID: 054b2081-46ce-40dc-85e6-65efc0e9aef5
# Model: Sonnet
# Interval: Every 30 minutes
# Script: /Users/erik/.openclaw/workspace/bot_monitor.py
# Other bots disabled - focus on one working bot

## Simmer Trading (2-3x per day)
If it's been >4 hours since last Simmer check:
1. Call briefing: `GET /api/sdk/briefing?since=<last_check_timestamp>` with Bearer sk_live_218e3b33520a4a89f203664a640475bc311cf2ef61dfe8f8152781413dbd37ac
2. Review expiring positions — exit or hold?
3. Check significant price moves — reassess?
4. Look at new opportunities & high divergence markets
5. Trade weather markets using NOAA data when edge exists
6. Update lastSimmerCheck in memory/heartbeat-state.json

## Link Drop Auto-Summary

When Erik pastes a URL in chat (not as part of a question), automatically:
1. Fetch and read the content
2. Provide a 3-5 sentence summary
3. Extract top 3 takeaways
4. Note anything applicable to Miyamoto Labs
5. Save to /Users/erik/.openclaw/workspace/research/library/YYYY-MM-DD_<slug>.md
