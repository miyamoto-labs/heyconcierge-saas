"use client";
import { motion } from "framer-motion";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import AnimatedCounter from "../components/AnimatedCounter";

const agents = [
  { name: "Miyamoto", role: "Lead Agent — Strategy & Coordination", status: "Active" },
  { name: "Builder-01", role: "Full-stack Development", status: "Active" },
  { name: "Builder-02", role: "Frontend & UI/UX", status: "Active" },
  { name: "Security-01", role: "Security Scanning & Audits", status: "Active" },
  { name: "Trader-01", role: "Hyperliquid Scalping", status: "Active" },
  { name: "Trader-02", role: "Polymarket Arbitrage", status: "Active" },
  { name: "Research-01", role: "Market & Tech Research", status: "Active" },
  { name: "Monitor-01", role: "Infrastructure Monitoring", status: "Active" },
  { name: "Social-01", role: "Content & Social Media", status: "Active" },
  { name: "DevOps-01", role: "CI/CD & Deployment", status: "Active" },
  { name: "QA-01", role: "Testing & Quality", status: "Active" },
];

const tech = ["Next.js", "Python", "Solidity", "OpenClaw", "TypeScript", "TailwindCSS", "Supabase", "Vercel", "Node.js", "Framer Motion"];

const values = [
  { title: "Ship Fast", desc: "We deploy daily. Our agents don't sleep, don't take breaks, and don't bikeshed. Speed is a feature." },
  { title: "Build Real Things", desc: "No vaporware. Every product we list is real, functional, and used. We sell what we make." },
  { title: "AI-Native", desc: "We're not a company that uses AI. We ARE AI. 11 agents, 1 human. This is what the future looks like." },
];

export default function About() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Miyamoto Labs</h1>
            <p className="text-white/50 text-xl leading-relaxed max-w-2xl mb-4">
              A software factory where <span className="text-accent font-semibold">11 AI agents</span> and <span className="text-white font-semibold">1 human</span> build,
              ship, and sell AI-powered products — 24 hours a day, 7 days a week.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-16 mt-16">
            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "5", label: "Products Shipped" },
                { value: "11", label: "AI Agents" },
                { value: "50000", label: "Lines of Code", suffix: "+" },
                { value: "24/7", label: "Uptime" },
              ].map((s) => (
                <div key={s.label} className="gradient-border p-5 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                    <AnimatedCounter value={s.value} suffix={s.suffix || ""} />
                  </div>
                  <div className="text-xs text-white/40">{s.label}</div>
                </div>
              ))}
            </section>

            {/* Founder */}
            <section>
              <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-6">Founder</h2>
              <div className="gradient-border p-8">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-white text-xl font-bold">E</div>
                  <div>
                    <div className="text-xl font-semibold">Erik Austheim</div>
                    <div className="text-white/40 text-sm">Founder & CEO — Oslo, Norway 🇳🇴</div>
                  </div>
                </div>
                <p className="text-white/45 text-sm leading-relaxed max-w-2xl">
                  Erik defines product strategy and direction. He built Miyamoto Labs to prove that a single human with a fleet of AI agents
                  can out-ship traditional teams. Everything else — coding, testing, deploying, monitoring, trading — is done by the agents.
                </p>
              </div>
            </section>

            {/* Agent Fleet */}
            <section>
              <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-6">The Agent Fleet</h2>
              <p className="text-white/40 text-sm mb-6 max-w-xl">
                Our engineering team is a fleet of AI agents powered by{" "}
                <a href="https://openclaw.app" target="_blank" className="text-accent hover:underline">OpenClaw</a>.
                Each agent has a specific domain and they coordinate autonomously.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {agents.map((a, i) => (
                  <motion.div
                    key={a.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-surface border border-white/5 rounded-lg p-4 hover:border-accent/20 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <div className="font-mono text-sm font-medium group-hover:text-accent transition-colors">{a.name}</div>
                        <div className="text-xs text-white/30">{a.role}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a
                  href="https://agent-dashboard-six-ruddy.vercel.app"
                  target="_blank"
                  className="text-xs text-accent hover:underline"
                >
                  View live agent dashboard →
                </a>
              </div>
            </section>

            {/* How We Work */}
            <section>
              <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-6">How We Work</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { n: "01", t: "Design", d: "Erik defines the product. AI agents research the market, analyze competition, and prototype solutions." },
                  { n: "02", t: "Build", d: "Agents write code, run tests, review each other's work, and iterate. Humans review final output." },
                  { n: "03", t: "Ship", d: "Automated CI/CD deployment. Continuous monitoring. Agents detect and fix issues autonomously." },
                ].map((s) => (
                  <div key={s.n} className="gradient-border p-6">
                    <div className="text-accent font-mono text-sm mb-3">{s.n}</div>
                    <div className="font-semibold mb-2">{s.t}</div>
                    <div className="text-white/40 text-sm leading-relaxed">{s.d}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Values */}
            <section>
              <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-6">Our Philosophy</h2>
              <div className="space-y-4">
                {values.map((v) => (
                  <div key={v.title} className="gradient-border p-6">
                    <h3 className="font-semibold text-accent mb-2">{v.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tech Stack */}
            <section>
              <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-6">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {tech.map((t) => (
                  <span key={t} className="text-sm font-mono text-white/50 bg-white/5 px-3 py-1.5 rounded-md border border-white/5 hover:border-accent/20 transition-colors">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
