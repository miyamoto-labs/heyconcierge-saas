"use client";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useState } from "react";

type ProjectStatus = "🟢 Live" | "🟡 In Progress" | "🔴 Needs Attention" | "🟢 Active" | "🟢 Deployed";

interface Project {
  name: string;
  description: string;
  status: ProjectStatus;
  url?: string;
  icon: string;
  category: "Product" | "Infrastructure" | "Trading" | "Social" | "Token";
  tech?: string[];
}

const projects: Project[] = [
  { name: "TrustClaw", description: "Security-verified skill marketplace for AI agents. Malware scanning, pattern detection, and trust scores for OpenClaw skills.", status: "🟢 Live", url: "https://trustclaw.xyz", icon: "🔒", category: "Product", tech: ["Next.js", "Vercel", "Security"] },
  { name: "Agent Builder", description: "Visual AI agent builder with drag-and-drop interface. Build complex agent workflows without code.", status: "🟢 Live", url: "https://agent-builder-gamma.vercel.app", icon: "🛠", category: "Product", tech: ["React", "DnD", "AI"] },
  { name: "Agent Monitor", description: "Real-time agent fleet monitoring. Track performance, uptime, errors, and resource usage across all your AI agents.", status: "🟢 Live", url: "https://agent-monitor-app.vercel.app", icon: "📊", category: "Infrastructure", tech: ["Next.js", "WebSocket", "Analytics"] },
  { name: "Agent Dashboard", description: "Fleet management dashboard for autonomous AI agents. Control panel for multi-agent orchestration.", status: "🟢 Live", url: "https://agent-dashboard-six-ruddy.vercel.app", icon: "🎛", category: "Infrastructure", tech: ["Next.js", "Real-time", "Management"] },
  { name: "Trading Terminal", description: "Professional-grade crypto trading dashboard. Real-time charts, order execution, portfolio analytics.", status: "🟢 Live", url: "https://trading-terminal-two.vercel.app", icon: "📈", category: "Trading", tech: ["Next.js", "TradingView", "WebSocket"] },
  { name: "$MIYAMOTO Token", description: "Native token for Miyamoto Labs ecosystem. Deployed on Base chain.", status: "🟢 Deployed", url: "https://basescan.org/token/0x6091CF6b4111a60fa72EBF5e289560C177f44B07", icon: "🪙", category: "Token", tech: ["Solidity", "Base", "DeFi"] },
  { name: "Hyperliquid Bot", description: "Autonomous crypto scalping bot. High-frequency trading with adaptive algorithms on Hyperliquid DEX.", status: "🟡 In Progress", icon: "⚡", category: "Trading", tech: ["Python", "HFT", "MEV"] },
  { name: "Polymarket Bot", description: "Prediction market arbitrage bot. Automated cross-market arbitrage and event outcome analysis.", status: "🟡 In Progress", icon: "🎲", category: "Trading", tech: ["Python", "ML", "Arbitrage"] },
  { name: "@dostoyevskyai", description: "Automated crypto commentary bot on Twitter. Philosophical takes on markets, powered by DeepSeek.", status: "🟢 Active", url: "https://twitter.com/dostoyevskyai", icon: "🐦", category: "Social", tech: ["Python", "Twitter API", "LLM"] },
  { name: "Miyamoto Labs Website", description: "Flagship website and product showcase. Built with Next.js, deployed on Vercel.", status: "🟢 Live", url: "https://miyamotolabs.com", icon: "🌐", category: "Product", tech: ["Next.js", "Tailwind", "Vercel"] },
];

const categories = ["All", "Product", "Infrastructure", "Trading", "Social", "Token"];

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const filteredProjects = selectedCategory === "All" ? projects : projects.filter(p => p.category === selectedCategory);

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24">
        <section className="mx-auto max-w-6xl px-6 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {projects.length} Projects Shipped
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Our <span className="bg-gradient-to-r from-accent to-purple-300 bg-clip-text text-transparent">Projects</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl">
            Everything we&apos;ve built. Real products, shipped to production. No vaporware.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 mb-12">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat ? "bg-accent text-white" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.name}
                className="group relative gradient-border p-6 hover:bg-surface-light/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{project.icon}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 font-medium whitespace-nowrap">
                    {project.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{project.name}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-3">{project.description}</p>
                {project.tech && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tech.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/30 font-mono">{t}</span>
                    ))}
                  </div>
                )}
                {project.url && (
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-light transition-colors">
                    Visit Project <span>→</span>
                  </a>
                )}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-purple-600/5 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 mt-24 text-center">
          <div className="gradient-border p-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Want Something Built?</h2>
            <p className="text-white/40 mb-8 max-w-lg mx-auto">We ship fast. From concept to production in weeks, not months.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Get in Touch <span>→</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
