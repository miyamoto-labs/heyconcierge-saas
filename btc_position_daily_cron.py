#!/usr/bin/env python3
"""
Cron job for BTC daily position trader - runs every hour
"""

import sys
sys.path.append('/Users/erik/.openclaw/workspace')

from btc_position_daily import BTCPositionDaily

if __name__ == '__main__':
    # PAPER MODE - set to False for live trading
    bot = BTCPositionDaily(paper_mode=True)
    bot.run()
