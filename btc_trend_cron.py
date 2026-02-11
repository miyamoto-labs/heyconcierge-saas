#!/usr/bin/env python3
"""
Cron job for BTC trend bot - runs every 15 minutes
"""

import sys
sys.path.append('/Users/erik/.openclaw/workspace')

from btc_trend_bot import BTCTrendBot

if __name__ == '__main__':
    # PAPER MODE - set to False for live trading
    bot = BTCTrendBot(paper_mode=True)
    bot.run()
