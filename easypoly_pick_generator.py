#!/usr/bin/env python3
"""
EasyPoly Pick Generator — Ported from n8n "Polymarket AI Betting Concierge"
===========================================================================
Exact same logic as the n8n flow:
1. Fetch 300 markets from Gamma API (3 pages x 100, sorted by volume)
2. Filter: crypto + tech/AI only, >$10K volume, prices 15-85¢
3. Claude AI analysis: find 2-3 best mispricings
4. POST picks to EasyPoly bot /broadcast endpoint

Run 2x daily via cron or manually.
"""

import subprocess
import json
import sys
from datetime import datetime

# ── Config ──────────────────────────────────────────────────
GAMMA_API = "https://gamma-api.polymarket.com/markets"
ANTHROPIC_API = "https://api.anthropic.com/v1/messages"
ANTHROPIC_KEY = "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"
EASYPOLY_URL = "https://easypoly-bot-production.up.railway.app/broadcast"
EASYPOLY_KEY = "easypoly-2026"
MODEL = "claude-sonnet-4-20250514"

# ── Keywords (exact same as n8n) ────────────────────────────
CRYPTO_KW = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto',
    'coinbase', 'binance', 'kraken', 'microstrategy', 'saylor',
    'ripple', 'xrp', 'etf', 'staking', 'defi', 'stablecoin',
    'usdc', 'usdt', 'tether', 'circle', 'blackrock', 'grayscale',
    'fidelity', 'chainlink', 'uniswap', 'aave', 'memecoin',
    'dogecoin', 'doge'
]

TECH_AI_KW = [
    'openai', 'gpt', 'claude', 'anthropic', 'gemini', 'meta ai',
    'llama', 'nvidia', 'apple', 'microsoft', 'amazon',
    'artificial intelligence', 'ai model', 'ai safety', 'earnings',
    'ipo', 'acquisition', 'spacex', 'tesla', 'musk', 'altman',
    'semiconductor', 'chip', 'tsmc', 'arm holdings', 'tiktok',
    'bytedance', 'starlink'
]

MIN_VOLUME = 10000


def curl_json(url, method="GET", headers=None, body=None, timeout=30):
    """HTTP via curl subprocess (bypasses Python SSL issues)"""
    cmd = ["curl", "-s", "-m", str(timeout)]
    if method == "POST":
        cmd += ["-X", "POST"]
    if headers:
        for k, v in headers.items():
            cmd += ["-H", f"{k}: {v}"]
    if body:
        cmd += ["-d", json.dumps(body)]
    cmd.append(url)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        if result.returncode != 0:
            print(f"  curl error: {result.stderr[:200]}")
            return None
        return json.loads(result.stdout) if result.stdout.strip() else None
    except Exception as e:
        print(f"  curl exception: {e}")
        return None


def fetch_markets():
    """Fetch 300 markets from Gamma API (3 pages, sorted by 24h volume) — same as n8n"""
    print("📡 Fetching markets from Gamma API...")
    all_markets = []

    for offset in [0, 100, 200]:
        url = (f"{GAMMA_API}?closed=false&limit=100&offset={offset}"
               f"&order=volume24hr&ascending=false")
        data = curl_json(url)
        if data and isinstance(data, list):
            all_markets.extend(data)
            print(f"  Page {offset // 100 + 1}: {len(data)} markets")
        else:
            print(f"  Page {offset // 100 + 1}: failed")

    print(f"  Total: {len(all_markets)} markets fetched")
    return all_markets


def classify(market):
    """Classify market category — exact same logic as n8n Filter & Rank node"""
    text = ' '.join([
        market.get('question', ''),
        market.get('description', ''),
        ' '.join(market.get('tags', [])) if isinstance(market.get('tags'), list) else '',
        market.get('groupItemTitle', '')
    ]).lower()

    is_crypto = any(k in text for k in CRYPTO_KW)
    is_tech = any(k in text for k in TECH_AI_KW)

    if is_crypto and is_tech:
        return 'crypto+tech'
    if is_crypto:
        return 'crypto'
    if is_tech:
        return 'tech_ai'
    return None


def parse_safe(raw):
    """Safely parse JSON string or return list"""
    if not raw:
        return []
    try:
        return json.loads(raw) if isinstance(raw, str) else (raw if isinstance(raw, list) else [])
    except:
        return []


def filter_and_rank(markets):
    """Filter & Rank — exact same as n8n code node"""
    print("🔍 Filtering and ranking...")
    candidates = []

    for m in markets:
        cat = classify(m)
        if not cat:
            continue

        prices = [float(p) for p in parse_safe(m.get('outcomePrices'))]
        outcomes = parse_safe(m.get('outcomes'))
        clob_token_ids = parse_safe(m.get('clobTokenIds'))
        vol = float(m.get('volume24hr', '0') or '0')
        liq = float(m.get('liquidityClob', m.get('liquidity', '0')) or '0')

        if vol < MIN_VOLUME or not prices:
            continue

        # Must have at least one price between 15-85¢ (mispricing zone)
        if not any(0.15 < p < 0.85 for p in prices):
            continue

        candidates.append({
            'conditionId': m.get('conditionId', m.get('id', '')),
            'question': m.get('question', ''),
            'description': (m.get('description', '') or '')[:500],
            'slug': m.get('slug', ''),
            'category': cat,
            'outcomes': outcomes,
            'prices': prices,
            'clobTokenIds': clob_token_ids,
            'negRisk': bool(m.get('negRisk')),
            'volume24h': round(vol),
            'liquidity': round(liq),
            'endDate': m.get('endDate'),
            'url': f"https://polymarket.com/event/{m.get('slug', '')}"
        })

    # Sort by volume, take top 15
    candidates.sort(key=lambda x: x['volume24h'], reverse=True)
    top = candidates[:15]

    print(f"  {len(candidates)} relevant → top {len(top)} selected")
    return top


def build_ai_prompt(candidates):
    """Build AI Analysis Prompt — exact same as n8n code node"""
    today = datetime.now().strftime('%A, %B %d, %Y')

    market_list = ''
    for i, m in enumerate(candidates):
        ps = ' | '.join(f"{o}: {p*100:.1f}%" for o, p in zip(m['outcomes'], m['prices']))
        ts = ' | '.join(f"{o}={tid}" for o, tid in zip(m['outcomes'], m.get('clobTokenIds', [])))

        market_list += f"\n{i+1}. \"{m['question']}\""
        market_list += f"\n   Cat: {m['category']}{' [negRisk]' if m['negRisk'] else ''}"
        market_list += f"\n   Odds: {ps}"
        market_list += f"\n   Slug: {m['slug']}"
        market_list += f"\n   TokenIds: {ts}"
        market_list += f"\n   Vol: ${m['volume24h']:,} | Liq: ${m['liquidity']:,}"
        if m.get('endDate'):
            market_list += f"\n   Exp: {m['endDate'][:10]}"
        if m.get('description'):
            market_list += f"\n   Desc: {m['description'][:200]}"
        market_list += '\n'

    system = (
        "You are a sharp prediction market trader. Find the BEST 2-3 bets from Polymarket markets. "
        "Be opinionated and decisive.\n\n"
        "Your edge:\n"
        "- Markets overreact to headlines, underreact to base rates\n"
        "- Binary markets mispriced at extremes\n"
        "- Related markets have inconsistent odds\n"
        "- Time decay near expiry\n"
        "- Crowds bad at conditional probability\n\n"
        "You MUST pick 2-3 bets. There are ALWAYS mispricings.\n\n"
        "IMPORTANT: For each pick include the exact tokenId for your chosen outcome (YES or NO).\n\n"
        "Respond ONLY in JSON, no markdown backticks."
    )

    user = (
        f"Date: {today}\n\nPolymarket markets:\n{market_list}\n\n"
        "Pick 2-3 best +EV bets. JSON only:\n"
        "{\n"
        f'  "analysis_date": "{today}",\n'
        f'  "markets_analyzed": {len(candidates)},\n'
        '  "picks": [\n'
        '    {\n'
        '      "market": "exact question",\n'
        '      "slug": "slug-value",\n'
        '      "pick": "YES or NO",\n'
        '      "tokenId": "clobTokenId for chosen outcome",\n'
        '      "current_price": 0.55,\n'
        '      "estimated_prob": 0.72,\n'
        '      "edge": 0.17,\n'
        '      "reasoning": "2-3 sentences",\n'
        '      "risk": "main risk",\n'
        '      "confidence": "HIGH/MEDIUM/LOW",\n'
        '      "suggested_stake_usd": 5\n'
        '    }\n'
        '  ],\n'
        '  "market_commentary": "1 sentence"\n'
        '}'
    )

    return {
        'model': MODEL,
        'max_tokens': 4096,
        'system': system,
        'messages': [{'role': 'user', 'content': user}]
    }


def call_claude(request_body):
    """Call Claude AI — same as n8n HTTP node"""
    print("🤖 Calling Claude for analysis...")
    result = curl_json(
        ANTHROPIC_API,
        method="POST",
        headers={
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body=request_body,
        timeout=60
    )

    if not result:
        print("  ❌ Claude API failed")
        return None

    try:
        text = result['content'][0]['text']
        # Clean markdown backticks if present
        clean = text.strip()
        if '```' in clean:
            import re
            clean = re.sub(r'^[^{]*', '', clean)
            clean = re.sub(r'[^}]*$', '', clean)
        import re
        match = re.search(r'\{[\s\S]*\}', clean)
        if match:
            analysis = json.loads(match.group(0))
            print(f"  ✅ Got {len(analysis.get('picks', []))} picks")
            return analysis
        else:
            print(f"  ❌ No JSON found in response")
            print(f"  Raw: {text[:300]}")
            return None
    except Exception as e:
        print(f"  ❌ Parse error: {e}")
        return None


def format_and_broadcast(analysis, candidates):
    """Format picks and POST to EasyPoly /broadcast — replaces n8n Format + Telegram nodes"""
    picks = analysis.get('picks', [])
    if not picks:
        print("❌ No picks to broadcast")
        return

    broadcast_picks = []

    for i, p in enumerate(picks):
        # Find matching candidate for full tokenId (same logic as n8n)
        token_id = p.get('tokenId', '')
        found = None
        for c in candidates:
            if c['slug'] == p.get('slug') or c['question'] == p.get('market'):
                found = c
                break

        if not token_id and found:
            ids = found.get('clobTokenIds', [])
            outcomes = found.get('outcomes', [])
            side = p.get('pick', 'YES')
            idx = outcomes.index(side) if side in outcomes else 0
            token_id = ids[idx] if idx < len(ids) else ''

        # Verify tokenId is full length
        if token_id and len(token_id) < 50:
            print(f"  ⚠️  Pick {i+1}: tokenId looks truncated ({len(token_id)} chars), skipping")
            continue

        edge_pct = round((p.get('edge', 0)) * 100)
        est_pct = round((p.get('estimated_prob', 0)) * 100)
        cur_pct = round((p.get('current_price', 0)) * 100)

        reasoning = p.get('reasoning', '')
        if p.get('risk'):
            reasoning += f" ⚠️ Risk: {p['risk']}"

        broadcast_picks.append({
            'question': p.get('market', ''),
            'side': p.get('pick', 'YES'),
            'price': p.get('current_price', 0.5),
            'confidence': p.get('confidence', 'Medium'),
            'reasoning': f"AI estimate: {est_pct}% (edge +{edge_pct}%). {reasoning}",
            'tokenId': token_id
        })

        print(f"  📌 Pick {i+1}: {p.get('market', '?')[:60]}")
        print(f"     {p.get('pick', '?')} @ {cur_pct}¢ | AI: {est_pct}% | Edge: +{edge_pct}% | {p.get('confidence', '?')}")

    if not broadcast_picks:
        print("❌ No valid picks with tokenIds")
        return

    # POST to EasyPoly bot
    print(f"\n📡 Broadcasting {len(broadcast_picks)} picks to EasyPoly...")
    result = curl_json(
        EASYPOLY_URL,
        method="POST",
        headers={
            'Content-Type': 'application/json',
            'x-api-key': EASYPOLY_KEY
        },
        body={'picks': broadcast_picks}
    )

    if result and result.get('success'):
        print(f"  ✅ Sent {result.get('sent', '?')} messages to {result.get('subscribers', '?')} subscribers")
    else:
        print(f"  ❌ Broadcast failed: {result}")


def main():
    print("=" * 50)
    print("🎯 EASYPOLY PICK GENERATOR")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # Step 1: Fetch markets (same as n8n Fetch Page 1/2/3)
    markets = fetch_markets()
    if not markets:
        print("❌ No markets fetched, aborting")
        return

    # Step 2: Filter & Rank (same as n8n code node)
    candidates = filter_and_rank(markets)
    if not candidates:
        print("❌ No candidates after filtering, aborting")
        return

    # Step 3: Build prompt & call Claude (same as n8n Build AI Analysis + Claude node)
    prompt = build_ai_prompt(candidates)
    analysis = call_claude(prompt)
    if not analysis:
        print("❌ AI analysis failed, aborting")
        return

    # Step 4: Format & broadcast (replaces n8n Format AI Picks + Telegram nodes)
    format_and_broadcast(analysis, candidates)

    if analysis.get('market_commentary'):
        print(f"\n💬 {analysis['market_commentary']}")

    print("\n✅ Done!")


if __name__ == '__main__':
    main()
