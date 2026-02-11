'use client'
import { useState } from 'react'
import Link from 'next/link'

const stats = [
  { value: '1,000+', label: 'Agents Monitored' },
  { value: '99.9%', label: 'Uptime Detection' },
  { value: '<30s', label: 'Alert Time' },
  { value: '24/7', label: 'Coverage' },
]

const features = [
  {
    icon: '📡',
    title: 'Real-Time Heartbeats',
    desc: 'Know instantly when an agent stops responding. Sub-30-second detection with configurable thresholds.',
  },
  {
    icon: '🚨',
    title: 'Smart Alerts',
    desc: 'Slack, Discord, email, webhooks. Get notified through the channels you already use.',
  },
  {
    icon: '📊',
    title: 'Performance Analytics',
    desc: 'Track token usage, latency, error rates, and cost per task across your entire fleet.',
  },
  {
    icon: '🔍',
    title: 'Error Forensics',
    desc: 'Full trace logging with context. Understand exactly why an agent failed and fix it fast.',
  },
  {
    icon: '🏗️',
    title: '3-Line Integration',
    desc: 'pip install agent-monitor. Add 3 lines. Done. Works with any framework.',
  },
  {
    icon: '🛡️',
    title: 'Safety Guardrails',
    desc: 'Set boundaries. Auto-pause agents that exceed cost limits or exhibit anomalous behavior.',
  },
]

const tiers = [
  { name: 'Free', price: '$0', agents: '3 agents', cta: 'Start Free' },
  { name: 'Pro', price: '$19', agents: '25 agents', cta: 'Start Pro', highlight: true },
  { name: 'Business', price: '$49', agents: 'Unlimited', cta: 'Contact Us' },
]

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.08),transparent_60%)]" />
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-healthy/10 border border-healthy/20 text-healthy text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-healthy pulse-dot" />
            Now in Public Beta
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Never Let Your AI Agents{' '}
            <span className="gradient-text">Fail Silently</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Your agents break in production. Users complain before you notice.
            AgentWatch gives you real-time monitoring, instant alerts, and deep
            performance insights — so you fix issues before anyone knows.
          </p>

          {/* Waitlist */}
          <div className="max-w-md mx-auto mb-16">
            {submitted ? (
              <div className="flex items-center gap-2 justify-center text-healthy font-medium">
                <span>✓</span> You&apos;re on the list. We&apos;ll be in touch.
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-surface-2 border border-border text-white placeholder:text-zinc-500 focus:outline-none focus:border-healthy/50 transition-colors"
                />
                <button
                  onClick={() => email && setSubmitted(true)}
                  className="px-6 py-3 rounded-lg bg-healthy text-black font-semibold hover:bg-healthy/90 transition-colors whitespace-nowrap"
                >
                  Start Monitoring Free
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label} className="p-4">
                <div className="text-3xl font-bold text-white font-mono">{s.value}</div>
                <div className="text-sm text-zinc-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal Preview */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-xl bg-surface-2 border border-border overflow-hidden glow-green">
          <div className="flex items-center gap-2 px-4 py-3 bg-surface-3 border-b border-border">
            <div className="w-3 h-3 rounded-full bg-critical/60" />
            <div className="w-3 h-3 rounded-full bg-warning/60" />
            <div className="w-3 h-3 rounded-full bg-healthy/60" />
            <span className="ml-2 text-xs text-zinc-500 font-mono">agent-monitor — 3 lines to production</span>
          </div>
          <pre className="p-6 text-sm font-mono overflow-x-auto">
            <code>
              <span className="text-zinc-500"># Install</span>{'\n'}
              <span className="text-healthy">$</span> <span className="text-white">pip install agent-monitor</span>{'\n\n'}
              <span className="text-zinc-500"># Add to your agent</span>{'\n'}
              <span className="text-purple-400">from</span> <span className="text-white">agent_monitor</span> <span className="text-purple-400">import</span> <span className="text-white">Monitor</span>{'\n'}
              <span className="text-white">monitor</span> <span className="text-zinc-500">=</span> <span className="text-white">Monitor</span><span className="text-zinc-400">(</span><span className="text-warning">api_key</span><span className="text-zinc-500">=</span><span className="text-healthy">&quot;aw_live_...&quot;</span><span className="text-zinc-400">)</span>{'\n'}
              <span className="text-white">monitor</span><span className="text-zinc-400">.</span><span className="text-white">track</span><span className="text-zinc-400">(</span><span className="text-healthy">&quot;my-agent&quot;</span><span className="text-zinc-400">,</span> <span className="text-warning">event</span><span className="text-zinc-500">=</span><span className="text-healthy">&quot;task_complete&quot;</span><span className="text-zinc-400">)</span>{'\n\n'}
              <span className="text-zinc-500"># That&apos;s it. You&apos;re monitoring. ✓</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Everything you need to keep agents alive</h2>
        <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto">Built by engineers who got paged at 3 AM because an agent silently stopped working.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="p-6 rounded-xl bg-surface-2 border border-border card-hover">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Simple, honest pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(t => (
            <div
              key={t.name}
              className={`p-6 rounded-xl border ${
                t.highlight
                  ? 'bg-healthy/5 border-healthy/30 glow-green'
                  : 'bg-surface-2 border-border'
              } card-hover`}
            >
              <div className="text-sm text-zinc-500 mb-1">{t.name}</div>
              <div className="text-4xl font-bold text-white mb-1">
                {t.price}<span className="text-lg text-zinc-500">/mo</span>
              </div>
              <div className="text-sm text-zinc-400 mb-6">{t.agents}</div>
              <Link
                href="/pricing"
                className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  t.highlight
                    ? 'bg-healthy text-black hover:bg-healthy/90'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-border'
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-healthy pulse-dot" />
            AgentWatch
          </div>
          <div>© 2026 Miyamoto Labs. All rights reserved.</div>
        </div>
      </footer>
    </main>
  )
}
