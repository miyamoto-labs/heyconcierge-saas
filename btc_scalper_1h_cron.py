#!/usr/bin/env python3
"""
Cron job for BTC 1h scalper - runs every 5 minutes
"""

import sys
sys.path.append('/Users/erik/.openclaw/workspace')

from btc_scalper_1h import BTCScalper1h

if __name__ == '__main__':
    # PAPER MODE - set to False for live trading
    bot = BTCScalper1h(paper_mode=True)
    bot.run()
