# Hyperliquid Bot V3 — Design Document

**Created:** 2026-02-08
**Status:** Running (paper mode, PID 72214)
**Log:** /tmp/hl_bot_v3.log

## What Changed from V2

| | V2 (broken) | V3 (new) |
|---|---|---|
| Win rate | 30.6% | Target 50-60% |
| Trades/day | 20+ (hit limit) | Max 6 |
| Signal timeframe | 5m (noise) | 15m entry, 1h/4h trend |
| Stop loss | 0.15-0.25% (!) | 2.5% |
| Take profit | 0.2-0.375% | 5.0% (2:1 R:R) |
| Leverage | 8x | 3x |
| Risk/trade | 0.75% | 1.0% ($5.85) |
| Signal interval | 30 seconds | 5 minutes |
| Min between trades | None | 10 minutes |
| Trend confirmation | 5m EMA (useless) | 1h + 4h must agree |

## Core Philosophy

1. **Follow the trend ONLY** — 1h and 4h must both agree on direction. If they disagree, sit out.
2. **Buy pullbacks, not breakouts** — Enter when price pulls back to EMA21 on 15m, not when it's already extended.
3. **Wide stops** — 2.5% gives BTC room to breathe. At 3x leverage = 7.5% position risk.
4. **Let winners run** — Trailing stop activates at +2%, trails 1.2% behind. No cap on upside.
5. **Fewer trades** — Max 6/day, 10-minute cooldown, high confidence bar (70+).

## Entry Criteria (ALL required)

1. 1h trend score > 40 AND 4h trend score agrees on direction
2. 15m EMA9 > EMA21 (longs) or EMA9 < EMA21 (shorts)
3. Price within 1% of EMA21 (pullback, not chasing)
4. RSI not overbought/oversold
5. Volume >= 1x average
6. Confidence score >= 70

## Risk Management

- 1% risk per trade ($5.85)
- $15 max daily loss → stop trading
- 3 consecutive losses → 2 hour pause
- 1 position at a time
- Position capped at 15% of account

## Files

- Bot: `hyperliquid_bot_v3.py`
- State: `scalping_state_v3.json`
- Position: `position_v3.json`
- Config: `.hyperliquid_config.json`
