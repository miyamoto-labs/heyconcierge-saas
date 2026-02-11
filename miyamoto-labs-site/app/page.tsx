"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import AnimatedCounter from "./components/AnimatedCounter";

const fade = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };
const stagger = { animate: { transition: { staggerChildren: 0.1 } } };

const stats = [
  { value: "5", label: "Products Shipped", suffix: "" },
  { value: "11", label: "AI Agents Running", suffix: "" },
  { value: "24/7", label: "Uptime", suffix: "" },
  { value: "50000", label: "Lines of Code", suffix: "+" },
];

const capabilities = [
  { icon: "🔒", title: "Security & Trust", desc: "TrustClaw: Verify and secure AI agent skills before they touch your systems. Malware scanning, pattern detection, trust scores.", link: "/products" },
  { icon: "📊", title: "Agent Management", desc: "Fleet dashboard, real-time monitoring, alerts, performance analytics. Keep your agents healthy and productive.", link: "/products" },
  { icon: "📈", title: "Trading Systems", desc: "Autonomous crypto trading. Hyperliquid scalper, Polymarket arbitrage, multi-strategy adaptive algorithms.", link: "/products" },
  { icon: "🛠", title: "Custom Development", desc: "Hire our AI team. From concept to deployment — trading bots, automation, security tools, whatever you need.", link: "/contact" },
];

const products = [
  { name: "TrustClaw", status: "LIVE", statusColor: "bg-green-500", price: "Free – $29/mo", link: "https://trustclaw.xyz" },
  { name: "Agent Dashboard", status: "LIVE", statusColor: "bg-green-500", price: "Free – $19/mo", link: "https://agent-dashboard-six-ruddy.vercel.app" },
  { name: "Agent Monitor", status: "Soon", statusColor: "bg-yellow-500", price: "$19 – $49/mo", link: null },
  { name: "Trading Bot Suite", status: "Beta", statusColor: "bg-blue-500", price: "$99/mo", link: null },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative mx-auto max-w-6xl px-6">
            <motion.div {...stagger} initial="initial" animate="animate" className="max-w-3xl">
              <motion.div {...fade} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Software Factory — 11 AI Agents, 1 Human
              </motion.div>
              <motion.h1 {...fade} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                We Build What{" "}
                <span className="bg-gradient-to-r from-accent to-purple-300 bg-clip-text text-transparent">
                  Others Can&apos;t
                </span>
              </motion.h1>
              <motion.p {...fade} className="text-lg md:text-xl text-white/50 leading-relaxed mb-10 max-w-2xl">
                Miyamoto Labs is a software factory powered by autonomous AI agents.
                We ship AI-powered products — security platforms, trading bots, agent infrastructure — and sell what we make.
              </motion.p>
              <motion.div {...fade} className="flex flex-wrap gap-4">
                <Link href="/products" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Browse Products <span>→</span>
                </Link>
                <Link href="/checkout" className="inline-flex items-center gap-2 border border-accent/30 hover:border-accent/60 text-white/80 hover:text-white px-6 py-3 rounded-lg font-medium transition-all">
                  Buy Now
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-6 py-3 rounded-lg font-medium transition-all">
                  Contact Us
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/5 bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <motion.div key={s.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-accent mb-1">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-sm text-white/40">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Products Preview */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Products</h2>
              <p className="text-white/40 text-lg max-w-xl">Real products with real pricing. Built by AI, used by humans.</p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {products.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="gradient-border p-6 hover:bg-surface-light/50 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold group-hover:text-accent transition-colors">{p.name}</h3>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-white/5">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.statusColor}`} />
                      {p.status}
                    </span>
                  </div>
                  <div className="text-sm text-white/40 font-mono mb-3">{p.price}</div>
                  {p.link ? (
                    <a href={p.link} target="_blank" className="text-xs text-accent hover:underline">Visit →</a>
                  ) : (
                    <span className="text-xs text-white/20">Coming soon</span>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="text-center flex flex-col gap-2">
              <Link href="/products" className="text-sm text-accent hover:underline">View all products →</Link>
              <Link href="/projects" className="text-sm text-purple-400 hover:underline">See all shipped projects →</Link>
            </div>
          </div>
        </section>

        {/* What We Build */}
        <section className="py-24 md:py-32 border-t border-white/5">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Build</h2>
              <p className="text-white/40 text-lg max-w-xl">Products that work autonomously. No babysitting required.</p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              {capabilities.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="gradient-border p-8 hover:bg-surface-light/50 transition-colors group"
                >
                  <div className="text-2xl mb-4">{c.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors">{c.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">{c.desc}</p>
                  <Link href={c.link} className="text-xs text-accent hover:underline">Learn more →</Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Waitlist / Newsletter */}
        <section className="py-24 md:py-32 border-t border-white/5 bg-surface">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Stay in the Loop</h2>
              <p className="text-white/40 text-lg mb-10 max-w-lg mx-auto">
                Get notified when we ship new products. No spam, just launches.
              </p>
              <form
                action="https://formsubmit.co/dostoyevskyai@gmail.com"
                method="POST"
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input type="hidden" name="_subject" value="Miyamoto Labs — New Signup" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_next" value="https://miyamotolabs.com/?subscribed=true" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                />
                <button type="submit" className="bg-accent hover:bg-accent-light text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm whitespace-nowrap">
                  Notify Me →
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 md:py-32 border-t border-white/5">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Ship?</h2>
              <p className="text-white/40 text-lg mb-10 max-w-lg mx-auto">
                Whether you need a product off the shelf or a custom build, we&apos;ve got you.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/products" className="bg-accent hover:bg-accent-light text-white px-8 py-3.5 rounded-lg font-medium transition-colors">
                  See Products
                </Link>
                <Link href="/contact" className="border border-white/10 hover:border-white/20 text-white/70 hover:text-white px-8 py-3.5 rounded-lg font-medium transition-all">
                  Get in Touch
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
