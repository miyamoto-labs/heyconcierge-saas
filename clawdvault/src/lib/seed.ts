import { getDb, createCreator, createSkill } from "./db";

export function seedDatabase() {
  const db = getDb();
  
  // Check if already seeded
  const count = db.prepare("SELECT COUNT(*) as c FROM skills").get() as { c: number };
  if (count.c > 0) {
    console.log("Database already seeded");
    return;
  }

  console.log("Seeding database...");

  // Create creators
  const miyamotoLabs = createCreator({
    id: "miyamoto-labs",
    name: "Miyamoto Labs",
    wallet_address: "E1idUDFkK99kzpZ5bBkmV4NWAgdtegnRCMiszRwfYWwP",
    verified: true,
  });

  const openclaw = createCreator({
    id: "openclaw",
    name: "OpenClaw",
    wallet_address: null,
    verified: true,
  });

  const devopsAgent = createCreator({
    id: "devops-agent",
    name: "DevOpsAgent",
    wallet_address: null,
    verified: false,
  });

  const productivityPro = createCreator({
    id: "productivity-pro",
    name: "ProductivityPro",
    wallet_address: null,
    verified: true,
  });

  // Seed skills
  const skills = [
    {
      id: "bird",
      name: "Bird (Twitter/X)",
      description: "Full Twitter/X automation - post, engage, search, analytics. Cookie-based auth with rate limiting.",
      long_description: `Bird is a comprehensive Twitter/X CLI skill for OpenClaw agents. It provides full automation capabilities including:

- **Posting**: Create tweets, threads, and quote tweets
- **Engagement**: Like, retweet, reply, and follow/unfollow
- **Search**: Find tweets, users, and trending topics
- **Analytics**: Track engagement metrics and follower growth
- **DMs**: Read and send direct messages

The skill uses cookie-based authentication for reliable access without API limits. Rate limiting is built-in to avoid account restrictions.`,
      author_id: "miyamoto-labs",
      category: "Social",
      tags: ["twitter", "x", "social", "automation", "posting", "engagement"],
      price: 0,
      downloads: 1247,
      rating: 4.9,
      reviews_count: 47,
      verified: true,
      version: "2.1.0",
      success_rate: 96.2,
      install_command: "openclaw skill install bird",
      requirements: ["Cookie auth from Twitter/X", "OpenClaw v1.2.0+"],
      endpoints: ["POST /tweet", "GET /timeline", "POST /like", "POST /retweet", "GET /search", "GET /user/:id"],
    },
    {
      id: "polymarket",
      name: "Polymarket Trader",
      description: "Trade prediction markets with AI-powered analysis. CLOB integration with whale tracking.",
      long_description: `Polymarket Trader enables your OpenClaw agent to trade on Polymarket prediction markets with advanced features:

- **Market Discovery**: Find active markets, track odds changes
- **Trading**: Buy/sell shares via the CLOB (Central Limit Order Book)
- **Whale Tracking**: Monitor large positions and smart money flows
- **15-min Markets**: Specialized support for short-term BTC price predictions
- **Portfolio Management**: Track positions, P&L, and risk exposure

Requires USDC.e (bridged) on Polygon. Native USDC is NOT supported.`,
      author_id: "miyamoto-labs",
      category: "Trading",
      tags: ["trading", "polymarket", "predictions", "crypto", "defi"],
      price: 2.99,
      downloads: 892,
      rating: 4.8,
      reviews_count: 23,
      verified: true,
      version: "1.3.2",
      success_rate: 91.4,
      install_command: "openclaw skill install polymarket",
      requirements: ["Polygon wallet with USDC.e", "OpenClaw v1.2.0+"],
      endpoints: ["GET /markets", "GET /events", "POST /order", "GET /positions", "GET /whales"],
    },
    {
      id: "himalaya",
      name: "Himalaya (Email)",
      description: "CLI email management via IMAP/SMTP. Read, send, search, organize with MML support.",
      long_description: `Himalaya is a powerful CLI email client that integrates with OpenClaw for full email automation:

- **Read**: View inbox, specific folders, and individual messages
- **Send**: Compose and send emails with attachments
- **Search**: Full-text search across all mailboxes
- **Organize**: Move, delete, flag, and archive messages
- **Multi-account**: Support for multiple IMAP/SMTP accounts
- **MML Support**: Compose emails using markdown-like syntax

Works with Gmail, Outlook, iCloud, and any standard IMAP/SMTP provider.`,
      author_id: "openclaw",
      category: "Productivity",
      tags: ["email", "imap", "smtp", "productivity", "communication"],
      price: 0,
      downloads: 2341,
      rating: 4.7,
      reviews_count: 89,
      verified: true,
      version: "3.0.1",
      success_rate: 98.5,
      install_command: "openclaw skill install himalaya",
      requirements: ["IMAP/SMTP credentials", "OpenClaw v1.0.0+"],
      endpoints: ["GET /inbox", "GET /message/:id", "POST /send", "GET /search", "POST /move"],
    },
    {
      id: "hyperliquid",
      name: "Hyperliquid Bot",
      description: "Perpetual futures trading with funding rate integration. Multi-strategy scalping.",
      long_description: `Hyperliquid Bot provides professional-grade perpetual futures trading:

- **Order Execution**: Market, limit, and advanced order types
- **Funding Rate Arbitrage**: Track and exploit funding rate opportunities
- **Multi-Strategy**: Support for scalping, grid, and trend-following strategies
- **Risk Management**: Position sizing, stop-losses, and margin monitoring
- **Real-time Data**: WebSocket feeds for orderbook and trades

Requires a Hyperliquid wallet with deposited funds.`,
      author_id: "miyamoto-labs",
      category: "Trading",
      tags: ["trading", "hyperliquid", "futures", "crypto", "perpetuals"],
      price: 4.99,
      downloads: 654,
      rating: 4.6,
      reviews_count: 18,
      verified: true,
      version: "1.1.0",
      success_rate: 88.7,
      install_command: "openclaw skill install hyperliquid",
      requirements: ["Hyperliquid wallet", "API keys", "OpenClaw v1.2.0+"],
      endpoints: ["GET /account", "POST /order", "GET /positions", "GET /funding", "DELETE /order/:id"],
    },
    {
      id: "weather",
      name: "Weather",
      description: "Get current weather and forecasts. No API key required.",
      long_description: `Simple and reliable weather information for your OpenClaw agent:

- **Current Weather**: Temperature, humidity, wind, and conditions
- **Forecasts**: Hourly and daily forecasts up to 7 days
- **Location**: Support for city names, coordinates, or auto-detection
- **Alerts**: Severe weather warnings and advisories
- **Historical**: Past weather data for analysis

No API key required - uses open weather data sources.`,
      author_id: "openclaw",
      category: "Utilities",
      tags: ["weather", "forecast", "api", "utilities"],
      price: 0,
      downloads: 3421,
      rating: 4.9,
      reviews_count: 156,
      verified: true,
      version: "2.0.0",
      success_rate: 99.1,
      install_command: "openclaw skill install weather",
      requirements: ["OpenClaw v1.0.0+"],
      endpoints: ["GET /current", "GET /forecast", "GET /alerts", "GET /history"],
    },
    {
      id: "fiverr-api",
      name: "Fiverr Internal API",
      description: "Access Fiverr's internal API for orders, messages, gig management.",
      long_description: `Fiverr Internal API skill captures and replays Fiverr's undocumented internal APIs:

- **Orders**: View, manage, and track order status
- **Messages**: Read and send buyer/seller communications
- **Gigs**: Update gig details, pricing, and availability
- **Analytics**: Revenue, impressions, and conversion data
- **Reviews**: Monitor and respond to customer reviews

Captured via unbrowse - requires logging in through the skill setup.`,
      author_id: "miyamoto-labs",
      category: "Business",
      tags: ["fiverr", "freelance", "api", "unbrowse", "marketplace"],
      price: 1.99,
      downloads: 234,
      rating: 4.4,
      reviews_count: 12,
      verified: true,
      version: "1.0.3",
      success_rate: 85.3,
      install_command: "openclaw skill install fiverr-api",
      requirements: ["Fiverr account", "unbrowse login", "OpenClaw v1.2.0+"],
      endpoints: ["GET /orders", "GET /messages", "POST /message", "GET /gigs", "PUT /gig/:id"],
    },
    {
      id: "github-actions",
      name: "GitHub Actions Manager",
      description: "Manage GitHub workflows, trigger runs, view logs programmatically.",
      long_description: `GitHub Actions Manager provides full control over your CI/CD workflows:

- **Workflows**: List, enable, disable workflows
- **Runs**: Trigger, cancel, and re-run workflow executions
- **Logs**: Stream and download job logs
- **Artifacts**: Upload and download build artifacts
- **Secrets**: Manage repository and environment secrets

Uses GitHub's official API with personal access token authentication.`,
      author_id: "devops-agent",
      category: "Developer Tools",
      tags: ["github", "ci-cd", "actions", "devops", "automation"],
      price: 0,
      downloads: 567,
      rating: 4.5,
      reviews_count: 24,
      verified: false,
      version: "1.2.0",
      success_rate: 94.2,
      install_command: "openclaw skill install github-actions",
      requirements: ["GitHub PAT", "OpenClaw v1.1.0+"],
      endpoints: ["GET /workflows", "POST /workflow/:id/run", "GET /runs", "GET /logs/:id"],
    },
    {
      id: "notion-sync",
      name: "Notion Sync",
      description: "Bi-directional sync between Notion and local markdown files.",
      long_description: `Notion Sync keeps your Notion workspace and local files in perfect harmony:

- **Export**: Download Notion pages as clean markdown
- **Import**: Push local markdown files to Notion
- **Bi-directional**: Automatic conflict resolution
- **Databases**: Sync Notion databases to CSV/JSON
- **Watch Mode**: Real-time sync on file changes

Perfect for developers who want Notion's collaboration with local tooling.`,
      author_id: "productivity-pro",
      category: "Productivity",
      tags: ["notion", "markdown", "sync", "docs", "productivity"],
      price: 1.49,
      downloads: 1234,
      rating: 4.6,
      reviews_count: 67,
      verified: true,
      version: "2.3.1",
      success_rate: 92.8,
      install_command: "openclaw skill install notion-sync",
      requirements: ["Notion API key", "OpenClaw v1.1.0+"],
      endpoints: ["GET /pages", "POST /sync", "GET /databases", "POST /export"],
    },
  ];

  // Insert skills directly with all fields
  const insertSkill = db.prepare(`
    INSERT INTO skills (
      id, name, description, long_description, author_id, category, 
      tags, price, downloads, rating, reviews_count, verified, version, 
      success_rate, install_command, requirements, endpoints
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const skill of skills) {
    insertSkill.run(
      skill.id,
      skill.name,
      skill.description,
      skill.long_description,
      skill.author_id,
      skill.category,
      JSON.stringify(skill.tags),
      skill.price,
      skill.downloads,
      skill.rating,
      skill.reviews_count,
      skill.verified ? 1 : 0,
      skill.version,
      skill.success_rate,
      skill.install_command,
      JSON.stringify(skill.requirements),
      JSON.stringify(skill.endpoints)
    );
  }

  console.log(`Seeded ${skills.length} skills`);
}

// Auto-run if called directly
if (require.main === module) {
  seedDatabase();
}
