import { Agent, Activity, Project } from "./types";

// Static agent data (parsed from AGENT_REGISTRY.md)
export const agents: Agent[] = [
  { id: 1, name: "Miyamoto", role: "Primary AI Companion", level: "L4", status: "active", model: "Claude Opus", schedule: "Main session + heartbeat", projects: ["trustclaw", "trading-bots", "twitter-growth", "miyamoto-labs", "revenue-products"], lastReview: "—" },
  { id: 2, name: "Bot Monitor", role: "Infrastructure watchdog", level: "L2", status: "active", model: "DeepSeek", schedule: "Every 2h", projects: ["trading-bots"], lastReview: "2026-02-08" },
  { id: 3, name: "MoltX Engagement", role: "MoltX social posting", level: "L3", status: "active", model: "DeepSeek", schedule: "Every 4h", projects: ["twitter-growth", "miyamoto-labs"], lastReview: "2026-02-08" },
  { id: 4, name: "Twitter Engagement", role: "@dostoyevskyai engagement", level: "L3", status: "active", model: "DeepSeek", schedule: "Every 4h", projects: ["twitter-growth"], lastReview: "2026-02-08" },
  { id: 5, name: "Big Account Sniper", role: "Targets high-follower accounts", level: "L3", status: "active", model: "DeepSeek", schedule: "Every 4h", projects: ["twitter-growth"], lastReview: "2026-02-08" },
  { id: 6, name: "Problem Finder", role: "Market problems/opportunities research", level: "L2", status: "active", model: "DeepSeek", schedule: "Daily", projects: ["revenue-products", "trustclaw"], lastReview: "2026-02-08" },
  { id: 7, name: "Crypto Twitter", role: "Crypto-focused Twitter engagement", level: "L3", status: "active", model: "DeepSeek", schedule: "Every 4h", projects: ["twitter-growth"], lastReview: "2026-02-08" },
  { id: 8, name: "Daily Crypto Tweet", role: "Posts daily crypto analysis", level: "L3", status: "active", model: "DeepSeek", schedule: "9 AM Oslo", projects: ["twitter-growth"], lastReview: "2026-02-08" },
  { id: 9, name: "Opportunity Report", role: "Morning opportunity briefing", level: "L2", status: "active", model: "DeepSeek", schedule: "Daily", projects: ["revenue-products", "trading-bots"], lastReview: "2026-02-08" },
  { id: 10, name: "Improvement Analysis", role: "System improvement suggestions", level: "L2", status: "active", model: "Main session", schedule: "Daily", projects: ["trustclaw", "trading-bots", "twitter-growth", "miyamoto-labs", "revenue-products"], lastReview: "2026-02-08" },
  { id: 11, name: "Evening Promo", role: "Scheduled promotional content", level: "L3", status: "active", model: "Main session", schedule: "Evening", projects: ["twitter-growth", "miyamoto-labs"], lastReview: "2026-02-08" },
];

export const projects: Project[] = [
  { name: "TrustClaw", slug: "trustclaw", agents: ["Miyamoto", "Problem Finder", "Improvement Analysis"], status: "active", description: "Trust verification platform" },
  { name: "Trading Bots", slug: "trading-bots", agents: ["Bot Monitor", "Opportunity Report", "Improvement Analysis"], status: "active", description: "Automated crypto trading systems" },
  { name: "Twitter Growth", slug: "twitter-growth", agents: ["Twitter Engagement", "Big Account Sniper", "Crypto Twitter", "Daily Crypto Tweet", "MoltX Engagement", "Evening Promo", "Improvement Analysis"], status: "active", description: "Social media growth & engagement" },
  { name: "Miyamoto Labs", slug: "miyamoto-labs", agents: ["Miyamoto", "MoltX Engagement", "Evening Promo", "Improvement Analysis"], status: "active", description: "Brand & autonomous AI systems" },
  { name: "Revenue Products", slug: "revenue-products", agents: ["Problem Finder", "Opportunity Report", "Improvement Analysis"], status: "planning", description: "Product ideas & revenue streams" },
];

// Sample activity data (in production, read from agent-activity.json)
export const sampleActivity: Activity[] = [
  { id: "a1", timestamp: "2026-02-08T09:00:00Z", agent: "Daily Crypto Tweet", action: "Posted daily crypto analysis tweet", result: "success", details: "Tweet about BTC resistance levels, 12 likes" },
  { id: "a2", timestamp: "2026-02-08T08:30:00Z", agent: "Bot Monitor", action: "Infrastructure health check", result: "success", details: "All bots running, no issues detected" },
  { id: "a3", timestamp: "2026-02-08T08:00:00Z", agent: "Problem Finder", action: "Daily market scan", result: "success", details: "Found 3 potential opportunities in DeFi sector" },
  { id: "a4", timestamp: "2026-02-08T07:00:00Z", agent: "Twitter Engagement", action: "Engagement run: 5 replies, 8 likes", result: "success", details: "Engaged with crypto thought leaders" },
  { id: "a5", timestamp: "2026-02-08T06:30:00Z", agent: "Big Account Sniper", action: "Targeted high-follower accounts", result: "success", details: "Replied to 3 accounts with 50k+ followers" },
  { id: "a6", timestamp: "2026-02-08T06:00:00Z", agent: "MoltX Engagement", action: "Posted on MoltX platform", result: "success", details: "Shared AI agent insights post" },
  { id: "a7", timestamp: "2026-02-08T05:00:00Z", agent: "Crypto Twitter", action: "Crypto engagement run", result: "success", details: "5 quality replies on trending crypto topics" },
  { id: "a8", timestamp: "2026-02-08T04:00:00Z", agent: "Opportunity Report", action: "Generated morning briefing", result: "success", details: "Report saved to projects/revenue-products/" },
  { id: "a9", timestamp: "2026-02-07T22:00:00Z", agent: "Evening Promo", action: "Posted promotional content", result: "success", details: "2 promo tweets about Miyamoto Labs" },
  { id: "a10", timestamp: "2026-02-07T18:00:00Z", agent: "Twitter Engagement", action: "Engagement run", result: "fail", details: "Rate limit hit, only 2/5 replies sent" },
  { id: "a11", timestamp: "2026-02-07T14:00:00Z", agent: "Big Account Sniper", action: "Targeted high-follower accounts", result: "success", details: "4 replies to 100k+ accounts" },
  { id: "a12", timestamp: "2026-02-07T09:00:00Z", agent: "Daily Crypto Tweet", action: "Posted daily crypto analysis", result: "success", details: "ETH analysis thread, 23 likes" },
];
