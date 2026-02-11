#!/usr/bin/env python3
"""
Simmer Weather Trader v2 — Using official SDK spec from simmer.markets/skill.md
Trades weather temperature markets on Simmer (virtual $SIM) with NOAA forecast edge.
Designed to run on cron every 2-4 hours.
"""

import subprocess
import json
import time
import sys
from datetime import datetime, timezone

# === Config ===
SIMMER_API_KEY = "sk_live_218e3b33520a4a89f203664a640475bc311cf2ef61dfe8f8152781413dbd37ac"
SIMMER_BASE = "https://api.simmer.markets/api/sdk"
HEADERS = {"Authorization": f"Bearer {SIMMER_API_KEY}", "Content-Type": "application/json"}
TIMEOUT = 15  # seconds per request

TRADE_AMOUNT = 10.0  # $SIM per trade
MAX_TRADES = 5
EDGE_THRESHOLD = 0.10  # 10% minimum edge to trade

# NOAA grid points
NOAA_GRIDS = {
    "New York City": "OKX/33,37",
    "Chicago": "LOT/75,72",
    "Seattle": "SEW/124,67",
    "Atlanta": "FFC/50,88",
    "Dallas": "FWD/80,103",
    "Miami": "MFL/75,54",
}

STATE_FILE = "/Users/erik/.openclaw/workspace/simmer_state.json"

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def curl_get(url, timeout=TIMEOUT, extra_headers=None):
    """GET via curl subprocess (bypasses Python SSL issues)"""
    try:
        cmd = ["curl", "-s", "-m", str(timeout)]
        if "simmer.markets" in url:
            cmd += ["-H", f"Authorization: Bearer {SIMMER_API_KEY}"]
        if "weather.gov" in url:
            cmd += ["-H", "User-Agent: MiyamotoLabs/2.0 (weather-trading)"]
        cmd += ["-H", "Content-Type: application/json", url]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        if not r.stdout.strip():
            return None
        return json.loads(r.stdout)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
        log(f"⚠️ curl error: {e}")
        return None

def curl_post(url, data, timeout=TIMEOUT):
    """POST via curl subprocess"""
    try:
        r = subprocess.run(
            ["curl", "-s", "-m", str(timeout), "-X", "POST",
             "-H", f"Authorization: Bearer {SIMMER_API_KEY}",
             "-H", "Content-Type: application/json",
             "-d", json.dumps(data), url],
            capture_output=True, text=True, timeout=timeout + 5
        )
        if not r.stdout.strip():
            return None
        return json.loads(r.stdout)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
        log(f"⚠️ curl POST error: {e}")
        return None

def api_get(path, params=None):
    """GET with param building"""
    url = f"{SIMMER_BASE}{path}"
    if params:
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        url += f"?{qs}"
    result = curl_get(url)
    if isinstance(result, dict) and result.get("detail") == "Rate limit exceeded":
        log("⚠️ Rate limited, backing off 60s")
        time.sleep(60)
        return None
    return result

def api_post(path, data):
    """POST wrapper"""
    return curl_post(f"{SIMMER_BASE}{path}", data)

def get_noaa_forecasts():
    """Get NOAA weather forecasts for all tracked cities"""
    forecasts = {}
    for city, grid in NOAA_GRIDS.items():
        try:
            data = curl_get(f"https://api.weather.gov/gridpoints/{grid}/forecast", timeout=10)
            if not data:
                continue
            for period in data.get("properties", {}).get("periods", []):
                if period.get("isDaytime"):
                    date = period["startTime"][:10]
                    key = f"{city}|{date}"
                    forecasts[key] = {
                        "city": city,
                        "date": date,
                        "high_f": period["temperature"],
                        "forecast": period["shortForecast"],
                    }
        except Exception as e:
            log(f"  NOAA error {city}: {e}")
    return forecasts

def estimate_probability(noaa_high, threshold, direction):
    """Estimate probability based on NOAA forecast vs market threshold"""
    if direction == "above":
        diff = noaa_high - threshold
        if diff >= 10: return 0.98
        elif diff >= 5: return 0.92
        elif diff >= 3: return 0.82
        elif diff >= 1: return 0.65
        elif diff >= 0: return 0.50
        elif diff >= -2: return 0.30
        elif diff >= -5: return 0.10
        else: return 0.03
    elif direction == "below":
        diff = threshold - noaa_high
        if diff >= 10: return 0.98
        elif diff >= 5: return 0.92
        elif diff >= 3: return 0.82
        elif diff >= 1: return 0.65
        elif diff >= 0: return 0.50
        elif diff >= -2: return 0.30
        elif diff >= -5: return 0.10
        else: return 0.03
    elif direction == "between":
        diff = abs(noaa_high - threshold)
        if diff <= 1: return 0.30
        elif diff <= 3: return 0.12
        elif diff <= 5: return 0.05
        else: return 0.02
    return None

def parse_market_question(question):
    """Extract city, threshold, direction, date from market question"""
    q = question
    city = None
    for c in NOAA_GRIDS.keys():
        if c in q:
            city = c
            break
    if not city:
        return None, None, None, None

    # Direction + threshold
    threshold = None
    direction = None
    try:
        if "or higher" in q:
            direction = "above"
            threshold = int(q.split("be ")[1].split("°")[0])
        elif "or below" in q or "or lower" in q:
            direction = "below"
            threshold = int(q.split("be ")[1].split("°")[0])
        elif "between" in q:
            direction = "between"
            parts = q.split("between ")[1].split("°")[0]
            threshold = int(parts.split("-")[0])
        elif "be " in q and "°" in q:
            direction = "between"
            threshold = int(q.split("be ")[1].split("°")[0])
    except (ValueError, IndexError):
        pass

    # Date
    date = None
    months = {"January": "01", "February": "02", "March": "03", "April": "04",
              "May": "05", "June": "06", "July": "07", "August": "08",
              "September": "09", "October": "10", "November": "11", "December": "12"}
    for month_name, month_num in months.items():
        if month_name in q:
            try:
                day = int(q.split(month_name)[1].strip().rstrip("?").strip())
                date = f"2026-{month_num}-{day:02d}"
            except (ValueError, IndexError):
                pass
            break

    return city, threshold, direction, date

def run():
    log("🌦️ Simmer Weather Trader v2")
    log(f"Config: {TRADE_AMOUNT} $SIM/trade, {EDGE_THRESHOLD:.0%} min edge, max {MAX_TRADES} trades")

    # Step 1: Check if API is alive
    log("\n📡 Checking Simmer API...")
    briefing = api_get("/briefing")
    if briefing:
        bal = briefing.get("portfolio", {}).get("sim_balance", "?")
        rank = briefing.get("performance", {}).get("rank", "?")
        total = briefing.get("performance", {}).get("total_agents", "?")
        log(f"✅ Balance: {bal} $SIM | Rank: {rank}/{total}")

        # Check expiring positions
        expiring = briefing.get("positions", {}).get("expiring_soon", [])
        if expiring:
            log(f"⚠️ {len(expiring)} positions expiring soon!")
            for p in expiring:
                log(f"  → {p.get('question', '?')[:60]} | PnL: {p.get('pnl', 0):.2f}")
    else:
        log("❌ API unreachable — will try markets endpoint directly")

    # Step 2: Get NOAA forecasts
    log("\n🌡️ Fetching NOAA forecasts...")
    forecasts = get_noaa_forecasts()
    log(f"Got forecasts for {len(forecasts)} city-dates")
    for key, f in sorted(forecasts.items()):
        log(f"  {f['city']} {f['date']}: {f['high_f']}°F — {f['forecast']}")

    # Step 3: Get weather markets
    log("\n📈 Fetching weather markets...")
    data = api_get("/markets", {"tags": "weather", "status": "active", "limit": 50})
    if not data:
        # Fallback: try without tags
        data = api_get("/markets", {"q": "temperature", "limit": 50})
    if not data:
        log("❌ Cannot reach markets endpoint. API is down. Will retry next run.")
        state = {"last_run": datetime.now(timezone.utc).isoformat(), "trades_placed": 0, "api_status": "down"}
        try:
            with open(STATE_FILE, "w") as f: json.dump(state, f, indent=2)
        except: pass
        sys.exit(0)

    markets = data.get("markets", data) if isinstance(data, dict) else data
    log(f"Found {len(markets)} markets")

    # Step 4: Match markets to forecasts and find edge
    opportunities = []
    for m in markets:
        q = m.get("question", "")
        city, threshold, direction, date = parse_market_question(q)
        if not all([city, threshold, direction, date]):
            continue

        forecast_key = f"{city}|{date}"
        forecast = forecasts.get(forecast_key)
        if not forecast:
            continue

        noaa_high = forecast["high_f"]
        market_price = m.get("current_probability", m.get("current_price", 0.5))
        our_prob = estimate_probability(noaa_high, threshold, direction)
        if our_prob is None:
            continue

        edge = our_prob - market_price
        opportunities.append({
            "market_id": m.get("id"),
            "question": q,
            "url": m.get("url", ""),
            "city": city,
            "date": date,
            "noaa_high": noaa_high,
            "threshold": threshold,
            "direction": direction,
            "forecast": forecast["forecast"],
            "market_price": market_price,
            "our_prob": our_prob,
            "edge": edge,
        })

    opportunities.sort(key=lambda x: abs(x["edge"]), reverse=True)

    log(f"\n🎯 Evaluated {len(opportunities)} matchable markets:")
    for o in opportunities[:10]:
        emoji = "🟢" if abs(o["edge"]) > 0.15 else "🟡" if abs(o["edge"]) > 0.08 else "⚪"
        log(f"  {emoji} {o['city']} {o['date']}: NOAA {o['noaa_high']}°F vs {o['direction']} {o['threshold']}°F")
        log(f"     Ours: {o['our_prob']:.0%} | Market: {o['market_price']:.1%} | Edge: {o['edge']:+.1%}")

    # Step 5: Trade best opportunities
    trades = 0
    log(f"\n💰 Trading (min edge: {EDGE_THRESHOLD:.0%})...")
    for o in opportunities:
        if trades >= MAX_TRADES:
            break
        if abs(o["edge"]) < EDGE_THRESHOLD:
            continue

        # Determine side
        if o["edge"] > 0:
            side = "yes"
            reasoning = (f"NOAA forecasts {o['city']} high of {o['noaa_high']}°F on {o['date']}. "
                        f"Market prices {o['direction']} {o['threshold']}°F at {o['market_price']:.0%} YES. "
                        f"My estimate: {o['our_prob']:.0%}. Edge: {o['edge']:+.0%}. "
                        f"Forecast: {o['forecast']}.")
        else:
            side = "no"
            reasoning = (f"NOAA forecasts {o['city']} high of {o['noaa_high']}°F on {o['date']}. "
                        f"Market overprices {o['direction']} {o['threshold']}°F at {o['market_price']:.0%} YES. "
                        f"My estimate: {o['our_prob']:.0%}. Selling. "
                        f"Forecast: {o['forecast']}.")

        log(f"\n  {'🟢 BUY YES' if side == 'yes' else '🔴 BUY NO'}: {o['question'][:70]}")
        log(f"  {TRADE_AMOUNT} $SIM | Edge: {abs(o['edge']):+.0%}")

        result = api_post("/trade", {
            "market_id": o["market_id"],
            "side": side,
            "amount": TRADE_AMOUNT,
            "venue": "simmer",
            "source": "sdk:miyamoto-weather-v2",
            "reasoning": reasoning,
        })

        if result and result.get("shares_bought"):
            log(f"  ✅ Bought {result['shares_bought']:.1f} shares for {result.get('cost', '?')} $SIM")
            trades += 1
        elif result:
            log(f"  ❌ {result.get('detail', result.get('error', json.dumps(result)[:100]))}")
        else:
            log(f"  ❌ No response (API down)")

        time.sleep(12)  # Respect 6 trades/min rate limit

    # Save state
    state = {
        "last_run": datetime.now(timezone.utc).isoformat(),
        "trades_placed": trades,
        "markets_evaluated": len(opportunities),
        "api_status": "up" if data else "down",
    }
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except:
        pass

    log(f"\n📊 Done: {trades} trades placed, {len(opportunities)} markets evaluated")

if __name__ == "__main__":
    run()
