'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight, Check, Zap, Download, Bot, Clock, Code2, Brain, DollarSign, LayoutTemplate, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const features = [
  { title: '5-Minute Setup', desc: 'Pick a template, customize, deploy. Production-ready agents in minutes.', icon: <Clock className="w-6 h-6" />, color: '#8b5cf6' },
  { title: 'No Vendor Lock-in', desc: 'Export as Python, Docker, or OpenClaw config. Your agent, your code.', icon: <Code2 className="w-6 h-6" />, color: '#3b82f6' },
  { title: 'AI-First Design', desc: 'Built for LLM agents with reasoning and memory, not just if/then automations.', icon: <Brain className="w-6 h-6" />, color: '#ec4899' },
  { title: '10x Cheaper', desc: '$29/mo vs $99/user/mo competitors. Free tier included.', icon: <DollarSign className="w-6 h-6" />, color: '#10b981' },
  { title: 'Production Templates', desc: 'Customer support, social media, email responder, price monitor, content creator. Real agents, not demos.', icon: <LayoutTemplate className="w-6 h-6" />, color: '#f59e0b' },
]

const templates = [
  { name: 'Customer Support', icon: '🎧', cat: 'Free' },
  { name: 'Social Media Manager', icon: '📱', cat: 'Pro' },
  { name: 'Email Responder', icon: '📧', cat: 'Pro' },
  { name: 'Price Monitor', icon: '💰', cat: 'Free' },
  { name: 'Content Creator', icon: '✏️', cat: 'Free' },
]

const comparison = [
  { feature: 'AI Agent Builder', agentforge: true, flowise: true, zapier: false, relevance: true },
  { feature: 'Visual Drag & Drop', agentforge: true, flowise: true, zapier: true, relevance: false },
  { feature: 'Export to Code', agentforge: true, flowise: false, zapier: false, relevance: false },
  { feature: 'LLM Reasoning & Memory', agentforge: true, flowise: true, zapier: false, relevance: true },
  { feature: 'Free Tier', agentforge: true, flowise: true, zapier: false, relevance: false },
  { feature: 'No Vendor Lock-in', agentforge: true, flowise: true, zapier: false, relevance: false },
  { feature: 'Production Templates', agentforge: true, flowise: false, zapier: true, relevance: true },
  { feature: 'Starting Price', agentforge: '$0', flowise: '$0*', zapier: '$19.99/mo', relevance: '$19/mo' },
]

// Animated demo nodes
const demoNodes = [
  { id: 1, label: 'Schedule', icon: '⏱', x: 60, y: 30, color: '#8b5cf6', delay: 0 },
  { id: 2, label: 'Fetch Data', icon: '🔄', x: 60, y: 120, color: '#3b82f6', delay: 0.3 },
  { id: 3, label: 'AI Analysis', icon: '🧠', x: 20, y: 210, color: '#ec4899', delay: 0.6 },
  { id: 4, label: 'Condition', icon: '🔀', x: 100, y: 210, color: '#f59e0b', delay: 0.9 },
  { id: 5, label: 'Send Alert', icon: '📤', x: 60, y: 300, color: '#10b981', delay: 1.2 },
]
const demoEdges = [
  { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 2, to: 4 }, { from: 3, to: 5 }, { from: 4, to: 5 },
]

function AnimatedDemo() {
  const [activeNode, setActiveNode] = useState(0)
  const [visible, setVisible] = useState(new Set<number>())

  useEffect(() => {
    demoNodes.forEach((node) => {
      setTimeout(() => setVisible(prev => { const next = new Set(Array.from(prev)); next.add(node.id); return next }), node.delay * 1000 + 500)
    })
    const interval = setInterval(() => {
      setActiveNode(prev => (prev + 1) % demoNodes.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="bg-gray-900/80 rounded-2xl border border-white/10 p-4 backdrop-blur-sm shadow-2xl shadow-purple-500/5">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-gray-500 ml-2">AI Agent Builder</span>
        </div>
        <svg width="100%" viewBox="0 0 180 340" className="overflow-visible">
          {demoEdges.map((edge, i) => {
            const from = demoNodes.find(n => n.id === edge.from)!
            const to = demoNodes.find(n => n.id === edge.to)!
            const isActive = demoNodes[activeNode]?.id === edge.from || demoNodes[activeNode]?.id === edge.to
            return (
              <line key={i}
                x1={from.x + 40} y1={from.y + 40}
                x2={to.x + 40} y2={to.y + 10}
                stroke={isActive ? '#8b5cf6' : '#374151'}
                strokeWidth={isActive ? 2 : 1}
                opacity={visible.has(edge.from) && visible.has(edge.to) ? 1 : 0}
                className="transition-all duration-500"
              />
            )
          })}
          {demoNodes.map(node => {
            const isActive = demoNodes[activeNode]?.id === node.id
            return (
              <g key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                opacity={visible.has(node.id) ? 1 : 0}
                className="transition-all duration-500"
              >
                <rect width="80" height="44" rx="8"
                  fill={isActive ? `${node.color}20` : '#111827'}
                  stroke={isActive ? node.color : '#374151'}
                  strokeWidth={isActive ? 2 : 1}
                  className="transition-all duration-300"
                />
                {isActive && (
                  <rect width="80" height="44" rx="8"
                    fill="none" stroke={node.color} strokeWidth="2"
                    opacity="0.3" className="animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                )}
                <text x="22" y="20" fontSize="14" className="select-none">{node.icon}</text>
                <text x="22" y="36" fontSize="8" fill="#9ca3af" className="select-none">{node.label}</text>
                <circle cx="40" cy="0" r="3" fill={node.color} opacity="0.6" />
                <circle cx="40" cy="44" r="3" fill={node.color} opacity="0.6" />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default function Home() {
  const [stat, setStat] = useState({ builders: 0, target: 47 })
  useEffect(() => {
    supabase.from('agent_projects').select('id', { count: 'exact', head: true }).then(({ count }: { count: number | null }) => {
      setStat({ builders: 0, target: Math.max(count || 0, 47) })
    })
  }, [])
  useEffect(() => {
    if (stat.builders >= stat.target) return
    const t = setInterval(() => {
      setStat(prev => ({ ...prev, builders: Math.min(prev.builders + Math.max(1, Math.ceil(prev.target / 40)), prev.target) }))
    }, 30)
    return () => clearInterval(t)
  }, [stat.target, stat.builders])

  return (
    <main className="pt-16 overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(236,72,153,0.06) 0%, transparent 50%)' }} />
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full mb-6 bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                {stat.builders.toLocaleString()}+ agents built
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-white">
                Build AI Agents<br />
                <span className="gradient-text">That Actually Work</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-lg mb-8 leading-relaxed">
                Create, deploy, and manage autonomous AI agents in minutes — not months. No code. No lock-in. Free to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/builder" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base transition hover:opacity-90 shadow-lg shadow-purple-500/20" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  Start Building Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base border border-white/10 text-gray-300 hover:bg-white/5 transition">
                  See Pricing
                </Link>
              </div>
            </div>
            <AnimatedDemo />
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-white/5 py-8 bg-gray-900/30">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs text-gray-600 uppercase tracking-widest mb-6">Built by Miyamoto Labs · {stat.builders.toLocaleString()}+ agents built</p>
          <div className="flex justify-center gap-8 md:gap-12 flex-wrap opacity-40">
            {['🐦 Twitter/X', '💬 Telegram', '📧 Gmail', '💼 Slack', '🦞 OpenClaw', '🔗 Webhooks', '🧠 GPT-4o', '🤖 Claude'].map(i => (
              <span key={i} className="text-sm text-gray-400 whitespace-nowrap">{i}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why AgentForge?</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">The fastest way to go from idea to production AI agent.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="group bg-gray-900/60 border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/20 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}15`, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-900/30 border-y border-white/5 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-white">Three steps. That&apos;s it.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Choose a Template', desc: 'Pick from production-ready agent blueprints or start from scratch.', color: '#8b5cf6' },
              { step: '02', title: 'Customize Logic', desc: 'Drag components, connect nodes, configure each step. See it flow in real-time.', color: '#3b82f6' },
              { step: '03', title: 'Export & Deploy', desc: 'Generate production-ready code: Python, Docker, OpenClaw skill, or raw config.', color: '#10b981' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="text-4xl font-bold mb-4" style={{ color: s.color, opacity: 0.3 }}>{s.step}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates showcase */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Production Templates</h2>
            <p className="text-gray-500">Real agents for real use cases. Not demos.</p>
          </div>
          <Link href="/templates" className="text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {templates.map(t => (
            <Link key={t.name} href="/templates"
              className="group bg-gray-900/60 border border-white/[0.06] rounded-xl p-4 hover:border-purple-500/20 transition-all text-center">
              <span className="text-3xl block mb-2">{t.icon}</span>
              <span className="text-xs font-medium text-white block mb-1 group-hover:text-purple-400 transition">{t.name}</span>
              <span className="text-[10px] text-gray-600">{t.cat === 'Free' ? '✓ Free' : '⭐ Pro'}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-gray-900/30 border-y border-white/5 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-3 text-white">How We Compare</h2>
          <p className="text-gray-500 text-center mb-12">AgentForge vs the alternatives.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Feature</th>
                  <th className="py-3 px-4 text-purple-400 font-semibold">AgentForge</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Flowise</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Zapier</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Relevance AI</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(row => (
                  <tr key={row.feature} className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-300">{row.feature}</td>
                    {[row.agentforge, row.flowise, row.zapier, row.relevance].map((val, i) => (
                      <td key={i} className="py-3 px-4 text-center">
                        {typeof val === 'boolean' ? (
                          val ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-gray-600 mx-auto" />
                        ) : (
                          <span className={i === 0 ? 'text-purple-400 font-semibold' : 'text-gray-400'}>{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-3 text-white">Simple Pricing</h2>
        <p className="text-gray-500 text-center mb-12">Start free. Scale when you need to.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: 'Free', price: '$0', period: '/forever', features: ['1 agent project', '3 basic templates', 'JSON export', '100 runs/month', 'Community support'], cta: 'Start Free', highlighted: false, href: '/builder' },
            { name: 'Pro', price: '$29', period: '/mo', features: ['10 agent projects', 'All templates', 'All export formats', 'Unlimited runs', 'Priority support', 'Analytics dashboard'], cta: 'Start Pro Trial', highlighted: true, href: '/pricing' },
            { name: 'Team', price: '$79', period: '/mo', features: ['Unlimited projects', 'All Pro features', 'Team collaboration', 'Custom templates', 'White-label export', 'SSO & audit logs'], cta: 'Contact Sales', highlighted: false, href: '/pricing' },
          ].map(tier => (
            <div key={tier.name} className={`rounded-2xl border p-6 flex flex-col transition-all ${tier.highlighted ? 'border-purple-500/50 bg-purple-500/5 relative shadow-lg shadow-purple-500/5 scale-[1.02]' : 'border-white/[0.06] bg-gray-900/40'}`}>
              {tier.highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-purple-600 text-white">Most Popular</span>}
              <h3 className="text-lg font-semibold text-white mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-500 text-sm">{tier.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <Check className="w-4 h-4 text-purple-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={tier.href} className={`block text-center px-4 py-3 rounded-xl font-medium transition ${tier.highlighted ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-white/10'}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to build your AI agent?</h2>
        <p className="text-gray-400 mb-8 text-lg">No coding required. Start from a template and deploy in minutes.</p>
        <Link href="/builder" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg shadow-purple-500/20 transition hover:opacity-90" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
          Start Building Free <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Bot className="w-4 h-4 text-purple-500" />
            <span className="font-semibold text-gray-400">AgentForge</span>
            <span>·</span>
            <a href="https://miyamotolabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">Powered by Miyamoto Labs</a>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link href="/templates" className="hover:text-gray-400 transition">Templates</Link>
            <Link href="/pricing" className="hover:text-gray-400 transition">Pricing</Link>
            <Link href="/builder" className="hover:text-gray-400 transition">Builder</Link>
          </div>
          <p className="text-xs text-gray-600">© 2026 Miyamoto Labs. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
