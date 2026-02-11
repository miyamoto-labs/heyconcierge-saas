#!/usr/bin/env python3
"""Create Notion pages for Miyamoto Labs project tracking."""
import json, requests

TOKEN = "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"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

# First find the welcome page to use as parent
# The welcome page URL was: 30142fa9d82880dca982ff4730143097
PARENT_PAGE = "30142fa9-d828-80dc-a982-ff4730143097"

def text(content, bold=False, link=None):
    t = {"text": {"content": content}}
    if link:
        t["text"]["link"] = {"url": link}
    if bold:
        t["annotations"] = {"bold": True}
    return t

def heading1(content):
    return {"type": "heading_1", "heading_1": {"rich_text": [text(content)]}}

def heading2(content):
    return {"type": "heading_2", "heading_2": {"rich_text": [text(content)]}}

def paragraph(*parts):
    return {"type": "paragraph", "paragraph": {"rich_text": list(parts)}}

def divider():
    return {"type": "divider", "divider": {}}

def callout(content, emoji="💡"):
    return {"type": "callout", "callout": {"rich_text": [text(content)], "icon": {"type": "emoji", "emoji": emoji}}}

# ========== PAGE 1: Project Master List ==========
print("Creating Project Master List...")
resp = requests.post("https://api.notion.com/v1/pages", headers=HEADERS, json={
    "parent": {"type": "page_id", "page_id": PARENT_PAGE},
    "icon": {"type": "emoji", "emoji": "🚀"},
    "properties": {
        "title": [{"text": {"content": "Miyamoto Labs — Project Master List"}}]
    },
    "children": [
        heading1("Shipped Products"),
        paragraph(text("All live Miyamoto Labs products and tools. Updated: Feb 8, 2026.")),
        divider(),
        
        heading2("🔐 TrustClaw — Security-Verified Skill Marketplace"),
        paragraph(text("✅ LIVE — "), text("trustclaw.xyz", bold=True, link="https://trustclaw.xyz")),
        paragraph(text("Security scanning + community trust for OpenClaw skills. WalletConnect integrated. Supabase backend.")),
        divider(),
        
        heading2("🧠 Agent Builder — Visual AI Agent IDE"),
        paragraph(text("✅ LIVE — "), text("agent-builder-gamma.vercel.app", bold=True, link="https://agent-builder-gamma.vercel.app")),
        paragraph(text("Drag-and-drop node canvas, 20+ components, 10 templates, Supabase auth, export generator.")),
        divider(),
        
        heading2("📊 AgentWatch — Fleet Monitoring"),
        paragraph(text("✅ LIVE — "), text("agent-monitor-app.vercel.app", bold=True, link="https://agent-monitor-app.vercel.app")),
        paragraph(text("Real-time monitoring for AI agent fleets. Alert feeds, charts, integration docs.")),
        divider(),
        
        heading2("🏛️ Agent Dashboard — Fleet Management"),
        paragraph(text("✅ LIVE — "), text("agent-dashboard-six-ruddy.vercel.app", bold=True, link="https://agent-dashboard-six-ruddy.vercel.app")),
        paragraph(text("Fleet grid, activity feed, project overview, performance stats.")),
        divider(),
        
        heading2("💹 Trading Terminal — Crypto Dashboard"),
        paragraph(text("✅ LIVE — "), text("trading-terminal-two.vercel.app", bold=True, link="https://trading-terminal-two.vercel.app")),
        paragraph(text("TradingView charts, P&L tracking, Fear/Greed index, Quick Trade, Journal.")),
        divider(),
        
        heading2("🪙 $MIYAMOTO Token — Native Token on Base"),
        paragraph(text("✅ DEPLOYED — "), text("View on BaseScan", bold=True, link="https://basescan.org/token/0x6091CF6b4111a60fa72EBF5e289560C177f44B07")),
        paragraph(text("Contract: 0x6091CF6b4111a60fa72EBF5e289560C177f44B07. Launched via Bankr Agent API.")),
        divider(),
        
        heading2("🏠 Miyamoto Labs Website"),
        paragraph(text("✅ LIVE — "), text("miyamotolabs.com", bold=True, link="https://miyamotolabs.com")),
        paragraph(text("Flagship site. Products, checkout (Stripe + crypto), about page, contact form.")),
        divider(),
        
        heading1("Trading Bots"),
        heading2("📈 Hyperliquid Scalping Bot"),
        paragraph(text("🟡 TESTING — Multi-timeframe trend following. $585 allocated. Hard blocks on counter-trend trades.")),
        heading2("🎲 Polymarket Arbitrage Bot"),
        paragraph(text("🟡 TESTING — Chainlink oracle lag strategy. $102 USDC.e. Paper trading active.")),
        divider(),
        
        heading1("Social & Marketing"),
        heading2("🐦 @dostoyevskyai Twitter"),
        paragraph(text("✅ ACTIVE — Daily crypto commentary. ⚠️ Getting flagged as automated — needs human-like variation.")),
        heading2("🤖 MoltX Agent"),
        paragraph(text("⚠️ NEEDS FIX — Hitting 64k context limit on DeepSeek.")),
        heading2("📖 Moltbook Agent"),
        paragraph(text("✅ ACTIVE — Profile: moltbook.com/u/Miyamoto")),
    ]
})
data = resp.json()
if "id" in data:
    print(f"✅ Project Master List created: {data['url']}")
    master_id = data["id"]
else:
    print(f"❌ Error: {data.get('message', data)}")
    master_id = None

# ========== PAGE 2: Daily Status — Feb 8, 2026 ==========
print("\nCreating Daily Status...")
resp2 = requests.post("https://api.notion.com/v1/pages", headers=HEADERS, json={
    "parent": {"type": "page_id", "page_id": PARENT_PAGE},
    "icon": {"type": "emoji", "emoji": "📋"},
    "properties": {
        "title": [{"text": {"content": "Daily Status — Feb 8, 2026"}}]
    },
    "children": [
        callout("Day 5 of Miyamoto Labs. Massive shipping day.", "🔥"),
        divider(),
        
        heading1("🟢 Shipped Today"),
        
        heading2("miyamotolabs.com DNS → Vercel"),
        paragraph(text("✅ DONE — Switched from Cloudflare to Namecheap BasicDNS. A record @ → 76.76.21.21, CNAME www → cname.vercel-dns.com. Both domains added to Vercel project. Propagating.")),
        
        heading2("OpenClaw Dashboard Authenticated"),
        paragraph(text("✅ DONE — Gateway token injected via URL. Dashboard at localhost:18789 fully operational.")),
        
        heading2("Namecheap API Captured"),
        paragraph(text("✅ DONE — 8 endpoints with cookie auth via unbrowse. Can manage DNS programmatically.")),
        
        heading2("Notion Integration Created"),
        paragraph(text("✅ DONE — Official API integration 'Miyamoto' created. Project Master List + Daily Status pages.")),
        
        heading2("Notion Project Master List"),
        paragraph(text("✅ DONE — Full catalog of all 10+ projects with links, status badges, descriptions.")),
        
        heading2("Website Project Showcase"),
        paragraph(text("🔄 IN PROGRESS — Sub-agent building sleek hover-card project grid for miyamotolabs.com")),
        
        divider(),
        heading1("🟡 In Progress"),
        
        heading2("Website Showcase Deployment"),
        paragraph(text("Sub-agent (Sonnet) is building interactive project cards with hover animations for miyamotolabs.com")),
        
        heading2("DNS Propagation"),
        paragraph(text("miyamotolabs.com DNS changed. Still resolving to old Cloudflare IPs. Should complete within 30 min.")),
        
        divider(),
        heading1("⚠️ Needs Attention"),
        
        heading2("Twitter @dostoyevskyai — Flagged as Automated"),
        paragraph(text("Daily tweet cron getting flagged. Need more human-like variation in content.")),
        
        heading2("MoltX Agent — Context Overflow"),
        paragraph(text("Hitting 64k token limit on DeepSeek. Needs prompt trimming or model switch.")),
        
        heading2("Agent Builder Supabase Tables"),
        paragraph(text("SQL ready but not executed. Need to run in Supabase dashboard (agent_projects, agent_templates, agent_exports).")),
        
        heading2("Stripe Payment Links"),
        paragraph(text("Placeholders on miyamotolabs.com checkout. Need real Stripe API keys.")),
        
        divider(),
        heading1("📊 Key Metrics"),
        paragraph(text("• Hyperliquid balance: $585.46 (testing)")),
        paragraph(text("• Polymarket balance: $102 USDC.e (paper trading)")),
        paragraph(text("• Live sites: 6 (TrustClaw, Agent Builder, Agent Monitor, Agent Dashboard, Trading Terminal, Miyamoto Labs)")),
        paragraph(text("• Cron jobs: 12 enabled, 5 disabled")),
        paragraph(text("• Active agents: 11 (L1-L4 framework)")),
        paragraph(text("• Token deployed: $MIYAMOTO on Base")),
        
        divider(),
        heading1("🔗 Quick Links"),
        paragraph(
            text("TrustClaw", link="https://trustclaw.xyz"), text(" | "),
            text("Agent Builder", link="https://agent-builder-gamma.vercel.app"), text(" | "),
            text("Agent Monitor", link="https://agent-monitor-app.vercel.app"), text(" | "),
            text("Dashboard", link="https://agent-dashboard-six-ruddy.vercel.app"), text(" | "),
            text("Trading Terminal", link="https://trading-terminal-two.vercel.app"), text(" | "),
            text("Miyamoto Labs", link="https://miyamotolabs.com"),
        ),
    ]
})
data2 = resp2.json()
if "id" in data2:
    print(f"✅ Daily Status created: {data2['url']}")
else:
    print(f"❌ Error: {data2.get('message', data2)}")

print("\nDone!")
