"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

type Status = "all" | "LIVE" | "Beta" | "Coming Soon" | "Available";

const products = [
  {
    name: "TrustClaw",
    tagline: "AI Agent Security Platform",
    desc: "Security verification for OpenClaw skills. Malware scanning, pattern detection, trust scores. Know what your agents are running before you run them.",
    features: ["Skill verification & scanning", "Malware & pattern detection", "Trust score ratings", "API integration", "Real-time alerts"],
    pricing: [
      { tier: "Free", price: 0, features: ["5 scans/day", "Basic reports"] },
      { tier: "Pro", price: 29, features: ["Unlimited scans", "Advanced reports", "API access", "Priority support"] },
      { tier: "Enterprise", price: null, features: ["Custom deployment", "SLA", "Dedicated support", "White-label"] },
    ],
    status: "LIVE" as const,
    statusColor: "bg-green-500",
    link: "https://trustclaw.xyz",
    icon: "🔒",
    category: "Security",
  },
  {
    name: "Agent Dashboard",
    tagline: "AI Agent Fleet Management",
    desc: "Real-time dashboard for managing your AI agent fleet. See agent status, activity feed, performance metrics, and health at a glance.",
    features: ["Real-time agent status", "Activity feed & logs", "Performance metrics", "Health monitoring", "Fleet overview"],
    pricing: [
      { tier: "Free", price: 0, features: ["Up to 3 agents", "Basic metrics"] },
      { tier: "Pro", price: 19, features: ["Unlimited agents", "Advanced analytics", "Custom alerts", "API access"] },
    ],
    status: "LIVE" as const,
    statusColor: "bg-green-500",
    link: "https://agent-dashboard-six-ruddy.vercel.app",
    icon: "📊",
    category: "Infrastructure",
  },
  {
    name: "Agent Monitor",
    tagline: "Production Agent Monitoring",
    desc: "Production-grade monitoring for AI agents. Real-time alerts, error detection, performance tracking, SDK integration for any agent framework.",
    features: ["Real-time monitoring", "Smart alerts & escalation", "SDK integration", "Error detection", "Performance analytics"],
    pricing: [
      { tier: "Starter", price: 19, features: ["Up to 10 agents", "Basic alerts", "7-day retention"] },
      { tier: "Pro", price: 49, features: ["Unlimited agents", "Advanced alerts", "90-day retention", "API access"] },
    ],
    status: "Coming Soon" as const,
    statusColor: "bg-yellow-500",
    link: null,
    icon: "🔍",
    category: "Infrastructure",
  },
  {
    name: "No-Code Agent Builder",
    tagline: "Visual Agent Creation",
    desc: "Drag-and-drop agent builder with pre-built templates. Create trading, research, social media, and automation agents without writing code.",
    features: ["Visual drag-and-drop builder", "Pre-built templates", "One-click deploy", "Custom logic nodes", "Marketplace integration"],
    pricing: [
      { tier: "Standard", price: 29, features: ["5 agents", "Basic templates", "Community support"] },
      { tier: "Pro", price: 79, features: ["Unlimited agents", "All templates", "Custom nodes", "Priority support"] },
    ],
    status: "Coming Soon" as const,
    statusColor: "bg-yellow-500",
    link: null,
    icon: "🧩",
    category: "Tools",
  },
  {
    name: "Trading Bot Suite",
    tagline: "Autonomous Crypto Trading",
    desc: "Battle-tested trading algorithms. Hyperliquid scalper, Polymarket arbitrage, multi-strategy adaptive trading that adjusts to market conditions.",
    features: ["Hyperliquid scalping", "Polymarket arbitrage", "Multi-strategy engine", "Risk management", "Performance reporting"],
    pricing: [
      { tier: "Standard", price: 99, features: ["All strategies", "Dedicated bot", "Daily reports", "Discord alerts"] },
      { tier: "Custom", price: null, features: ["Custom strategies", "Dedicated infrastructure", "Priority execution"] },
    ],
    status: "Beta" as const,
    statusColor: "bg-blue-500",
    link: null,
    icon: "📈",
    category: "Trading",
  },
  {
    name: "Custom Development",
    tagline: "Hire Our AI Team",
    desc: "Need something custom? Our team of 11 AI agents + 1 human will build it. Trading systems, automation, security tools, infrastructure — from concept to deployment.",
    features: ["Full-stack development", "AI/ML integration", "Trading systems", "Security audits", "Ongoing maintenance"],
    pricing: [
      { tier: "Project", price: 2500, features: ["Scoping & architecture", "Development & testing", "Deployment", "30 days support"] },
    ],
    status: "Available" as const,
    statusColor: "bg-green-500",
    link: null,
    icon: "🛠",
    category: "Services",
  },
];

const filters: Status[] = ["all", "LIVE", "Beta", "Coming Soon", "Available"];

export default function Products() {
  const [filter, setFilter] = useState<Status>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = filter === "all" ? products : products.filter((p) => p.status === filter);

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Products</h1>
            <p className="text-white/40 text-lg max-w-xl">
              Real products. Real prices. Built by autonomous AI agents.
            </p>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-10">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  filter === f
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-white/5 text-white/40 hover:text-white/60 hover:border-white/10"
                }`}
              >
                {f === "all" ? "All Products" : f}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {filtered.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="gradient-border overflow-hidden"
              >
                <div
                  className="p-8 md:p-10 hover:bg-surface-light/30 transition-colors group cursor-pointer"
                  onClick={() => setExpanded(expanded === p.name ? null : p.name)}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{p.icon}</span>
                        <h2 className="text-2xl font-bold group-hover:text-accent transition-colors">{p.name}</h2>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/5">
                          <span className={`w-1.5 h-1.5 rounded-full ${p.statusColor}`} />
                          {p.status}
                        </span>
                        <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded">{p.category}</span>
                      </div>
                      <p className="text-white/50 text-sm font-medium mb-2">{p.tagline}</p>
                      <p className="text-white/35 text-sm leading-relaxed max-w-2xl">{p.desc}</p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                      <div className="space-y-1">
                        {p.pricing.map((pr) => (
                          <div key={pr.tier} className="text-sm text-white/60 font-mono">
                            {pr.tier}: {pr.price === null ? "Contact us" : pr.price === 0 ? "Free" : `$${pr.price}${pr.tier === "Project" ? "" : "/mo"}`}
                          </div>
                        ))}
                      </div>
                      {p.link ? (
                        <a href={p.link} target="_blank" className="text-sm bg-accent hover:bg-accent-light text-white px-5 py-2 rounded-lg font-medium transition-colors">
                          Visit →
                        </a>
                      ) : p.status === "Available" ? (
                        <Link href="/contact" className="text-sm bg-accent hover:bg-accent-light text-white px-5 py-2 rounded-lg font-medium transition-colors">
                          Get Started →
                        </Link>
                      ) : p.status === "LIVE" || p.status === "Beta" ? (
                        <Link href={`/checkout?product=${p.name.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm border border-accent/30 hover:border-accent hover:bg-accent/10 text-accent px-5 py-2 rounded-lg font-medium transition-all">
                          Subscribe →
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`mailto:dostoyevskyai@gmail.com?subject=Waitlist: ${p.name}&body=I want to be notified when ${p.name} launches.`); }}
                          className="text-sm border border-white/10 hover:border-accent/50 text-white/60 hover:text-white px-5 py-2 rounded-lg font-medium transition-all"
                        >
                          Join Waitlist →
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded === p.name && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-surface-light/20"
                  >
                    <div className="p-8 md:p-10">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Features</h3>
                          <ul className="space-y-2">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                                <span className="text-accent text-xs">✓</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Plans</h3>
                          <div className="space-y-3">
                            {p.pricing.map((pr) => (
                              <div key={pr.tier} className="bg-black/50 border border-white/5 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-sm">{pr.tier}</span>
                                  <span className="text-accent font-mono text-sm">
                                    {pr.price === null ? "Custom" : pr.price === 0 ? "Free" : `$${pr.price}${pr.tier === "Project" ? "" : "/mo"}`}
                                  </span>
                                </div>
                                <ul className="space-y-1">
                                  {pr.features.map((f) => (
                                    <li key={f} className="text-xs text-white/30">• {f}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
