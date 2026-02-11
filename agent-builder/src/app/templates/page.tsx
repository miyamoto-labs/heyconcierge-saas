'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useSubscription } from '@/hooks/useSubscription'
import { supabase } from '@/lib/supabase'
import { NodeData, EdgeData } from '@/lib/types'
import { Search, Star, Users, ArrowRight, Lock, Bot } from 'lucide-react'
import { TEMPLATE_PLAN_MAP } from '@/lib/plans'

interface TemplateData {
  id: string; name: string; description: string; category: string; icon: string
  nodes: NodeData[]; edges: EdgeData[]; is_premium: boolean; uses: number
}

const TEMPLATES: TemplateData[] = [
  { id: 't1', name: 'Customer Support Bot', description: 'Classify incoming messages, generate AI responses, route complex issues to humans, and track resolution times.', category: 'Support', icon: '🎧', is_premium: false, uses: 1847,
    nodes: [
      { id: 'n1', type: 'webhook', category: 'triggers', label: 'New Ticket', icon: '🔗', position: { x: 200, y: 50 }, config: { path: '/support/ticket', method: 'POST' } },
      { id: 'n2', type: 'classify', category: 'ai', label: 'Classify Intent', icon: '🏷️', position: { x: 200, y: 180 }, config: { categories: 'billing, technical, general, urgent', input: '{{message}}' } },
      { id: 'n3', type: 'switch', category: 'conditions', label: 'Route by Type', icon: '🔃', position: { x: 200, y: 310 }, config: { variable: '{{intent}}', cases: 'billing, technical, general, urgent' } },
      { id: 'n4', type: 'llm_call', category: 'ai', label: 'Generate Reply', icon: '🧠', position: { x: 80, y: 440 }, config: { model: 'GPT-4o', system_prompt: 'You are a friendly support agent.' } },
      { id: 'n5', type: 'send_message', category: 'actions', label: 'Escalate to Human', icon: '📤', position: { x: 320, y: 440 }, config: { channel: 'Slack', recipient: '#escalations' } },
      { id: 'n6', type: 'email', category: 'integrations', label: 'Send Reply', icon: '📧', position: { x: 200, y: 570 }, config: { action: 'Send', to: '{{user_email}}' } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n3', target: 'n5' }, { id: 'e5', source: 'n4', target: 'n6' }]
  },
  { id: 't2', name: 'Social Media Manager', description: 'Generate AI content on a schedule, check quality, post to Twitter/X, and track engagement metrics.', category: 'Social', icon: '📱', is_premium: true, uses: 1523,
    nodes: [
      { id: 'n1', type: 'schedule', category: 'triggers', label: 'Every 4 Hours', icon: '⏱', position: { x: 200, y: 50 }, config: { cron: '0 */4 * * *' } },
      { id: 'n2', type: 'call_api', category: 'actions', label: 'Get Trending Topics', icon: '🔄', position: { x: 200, y: 180 }, config: { url: 'https://api.search.brave.com/res/v1/web/search', method: 'GET' } },
      { id: 'n3', type: 'llm_call', category: 'ai', label: 'Generate Post', icon: '🧠', position: { x: 200, y: 310 }, config: { model: 'Claude Sonnet', temperature: 0.8 } },
      { id: 'n4', type: 'classify', category: 'ai', label: 'Quality Check', icon: '🏷️', position: { x: 200, y: 440 }, config: { categories: 'publish, revise, discard' } },
      { id: 'n5', type: 'twitter', category: 'integrations', label: 'Post to X', icon: '🐦', position: { x: 200, y: 570 }, config: { action: 'Post Tweet' } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n4', target: 'n5' }]
  },
  { id: 't3', name: 'Email Responder', description: 'Monitor inbox, classify emails, draft AI responses, and auto-reply to routine messages.', category: 'Automation', icon: '📧', is_premium: true, uses: 892,
    nodes: [
      { id: 'n1', type: 'schedule', category: 'triggers', label: 'Every 15 min', icon: '⏱', position: { x: 200, y: 50 }, config: { cron: '*/15 * * * *' } },
      { id: 'n2', type: 'email', category: 'integrations', label: 'Check Inbox', icon: '📧', position: { x: 200, y: 180 }, config: { action: 'Read Inbox' } },
      { id: 'n3', type: 'filter', category: 'conditions', label: 'Filter Unread', icon: '🔢', position: { x: 200, y: 310 }, config: { field: 'emails' } },
      { id: 'n4', type: 'classify', category: 'ai', label: 'Classify Priority', icon: '🏷️', position: { x: 200, y: 440 }, config: { categories: 'urgent, routine, newsletter, spam' } },
      { id: 'n5', type: 'llm_call', category: 'ai', label: 'Draft Reply', icon: '🧠', position: { x: 100, y: 570 }, config: { model: 'GPT-4o' } },
      { id: 'n6', type: 'email', category: 'integrations', label: 'Send Reply', icon: '📧', position: { x: 300, y: 570 }, config: { action: 'Send' } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n4', target: 'n5' }, { id: 'e5', source: 'n5', target: 'n6' }]
  },
  { id: 't4', name: 'Data Pipeline', description: 'Scrape websites, extract structured data with AI, transform and load into your database.', category: 'Data', icon: '🔄', is_premium: true, uses: 756,
    nodes: [
      { id: 'n1', type: 'schedule', category: 'triggers', label: 'Hourly', icon: '⏱', position: { x: 200, y: 50 }, config: { cron: '0 * * * *' } },
      { id: 'n2', type: 'openclaw', category: 'integrations', label: 'Scrape Sources', icon: '🦞', position: { x: 200, y: 180 }, config: {} },
      { id: 'n3', type: 'extract', category: 'ai', label: 'Extract Fields', icon: '🔍', position: { x: 200, y: 310 }, config: { fields: 'title, price, url, date' } },
      { id: 'n4', type: 'run_script', category: 'actions', label: 'Transform Data', icon: '📜', position: { x: 200, y: 440 }, config: { language: 'Python' } },
      { id: 'n5', type: 'call_api', category: 'actions', label: 'Load to DB', icon: '🔄', position: { x: 200, y: 570 }, config: { method: 'POST' } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n4', target: 'n5' }]
  },
  { id: 't5', name: 'Content Creator', description: 'Generate blog posts from topics, research background, optimize for SEO, and publish to your CMS.', category: 'Content', icon: '✏️', is_premium: false, uses: 634,
    nodes: [
      { id: 'n1', type: 'manual', category: 'triggers', label: 'New Topic', icon: '▶️', position: { x: 200, y: 50 }, config: {} },
      { id: 'n2', type: 'call_api', category: 'actions', label: 'Research Topic', icon: '🔄', position: { x: 200, y: 180 }, config: { method: 'GET' } },
      { id: 'n3', type: 'summarize', category: 'ai', label: 'Summarize Research', icon: '📋', position: { x: 200, y: 310 }, config: { style: 'Bullet Points' } },
      { id: 'n4', type: 'llm_call', category: 'ai', label: 'Write Article', icon: '🧠', position: { x: 200, y: 440 }, config: { model: 'Claude Sonnet' } },
      { id: 'n5', type: 'extract', category: 'ai', label: 'SEO Metadata', icon: '🔍', position: { x: 200, y: 570 }, config: { fields: 'meta_title, meta_description, keywords' } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n4', target: 'n5' }]
  },
  { id: 't6', name: 'Lead Qualifier', description: 'Score incoming leads with AI, route hot leads to sales, nurture cold leads automatically.', category: 'Sales', icon: '🎯', is_premium: true, uses: 567,
    nodes: [
      { id: 'n1', type: 'webhook', category: 'triggers', label: 'New Lead', icon: '🔗', position: { x: 200, y: 50 }, config: {} },
      { id: 'n2', type: 'extract', category: 'ai', label: 'Parse Lead Data', icon: '🔍', position: { x: 200, y: 180 }, config: {} },
      { id: 'n3', type: 'llm_call', category: 'ai', label: 'Score Lead', icon: '🧠', position: { x: 200, y: 310 }, config: { model: 'GPT-4o' } },
      { id: 'n4', type: 'if_else', category: 'conditions', label: 'Hot Lead?', icon: '🔀', position: { x: 200, y: 440 }, config: {} },
      { id: 'n5', type: 'slack', category: 'integrations', label: 'Alert Sales', icon: '💼', position: { x: 80, y: 570 }, config: {} },
      { id: 'n6', type: 'email', category: 'integrations', label: 'Nurture Sequence', icon: '📧', position: { x: 320, y: 570 }, config: {} },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n4', target: 'n5' }, { id: 'e5', source: 'n4', target: 'n6' }]
  },
  { id: 't7', name: 'Price Monitor', description: 'Track competitor prices across websites, detect changes, and alert your team when opportunities arise.', category: 'Research', icon: '💰', is_premium: false, uses: 445,
    nodes: [
      { id: 'n1', type: 'schedule', category: 'triggers', label: 'Every 6 Hours', icon: '⏱', position: { x: 200, y: 50 }, config: { cron: '0 */6 * * *' } },
      { id: 'n2', type: 'openclaw', category: 'integrations', label: 'Capture Prices', icon: '🦞', position: { x: 200, y: 180 }, config: {} },
      { id: 'n3', type: 'extract', category: 'ai', label: 'Parse Prices', icon: '🔍', position: { x: 200, y: 310 }, config: { fields: 'product, price, currency' } },
      { id: 'n4', type: 'if_else', category: 'conditions', label: 'Price Changed?', icon: '🔀', position: { x: 200, y: 440 }, config: {} },
      { id: 'n5', type: 'send_message', category: 'actions', label: 'Price Alert', icon: '📤', position: { x: 200, y: 570 }, config: { channel: 'Telegram' } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n4', target: 'n5' }]
  },
  { id: 't8', name: 'Meeting Summarizer', description: 'Transcribe meeting notes, extract action items with owners and deadlines, distribute via Slack and email.', category: 'Automation', icon: '🎙️', is_premium: true, uses: 412,
    nodes: [
      { id: 'n1', type: 'webhook', category: 'triggers', label: 'Meeting Ends', icon: '🔗', position: { x: 200, y: 50 }, config: {} },
      { id: 'n2', type: 'summarize', category: 'ai', label: 'Summarize', icon: '📋', position: { x: 100, y: 180 }, config: { style: 'Executive' } },
      { id: 'n3', type: 'extract', category: 'ai', label: 'Action Items', icon: '🔍', position: { x: 300, y: 180 }, config: {} },
      { id: 'n4', type: 'slack', category: 'integrations', label: 'Post Summary', icon: '💼', position: { x: 100, y: 310 }, config: {} },
      { id: 'n5', type: 'email', category: 'integrations', label: 'Email Tasks', icon: '📧', position: { x: 300, y: 310 }, config: {} },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n1', target: 'n3' }, { id: 'e3', source: 'n2', target: 'n4' }, { id: 'e4', source: 'n3', target: 'n5' }]
  },
  { id: 't9', name: 'Sentiment Analyzer', description: 'Monitor brand mentions, analyze sentiment with AI, generate reports, and alert on negative trends.', category: 'Research', icon: '📊', is_premium: true, uses: 389,
    nodes: [
      { id: 'n1', type: 'schedule', category: 'triggers', label: 'Every 2 Hours', icon: '⏱', position: { x: 200, y: 50 }, config: {} },
      { id: 'n2', type: 'twitter', category: 'integrations', label: 'Search Mentions', icon: '🐦', position: { x: 200, y: 180 }, config: {} },
      { id: 'n3', type: 'classify', category: 'ai', label: 'Sentiment', icon: '🏷️', position: { x: 200, y: 310 }, config: {} },
      { id: 'n4', type: 'if_else', category: 'conditions', label: 'Negative?', icon: '🔀', position: { x: 200, y: 440 }, config: {} },
      { id: 'n5', type: 'send_message', category: 'actions', label: 'Alert PR Team', icon: '📤', position: { x: 100, y: 570 }, config: {} },
      { id: 'n6', type: 'summarize', category: 'ai', label: 'Daily Report', icon: '📋', position: { x: 300, y: 570 }, config: {} },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n4', target: 'n5' }, { id: 'e5', source: 'n4', target: 'n6' }]
  },
  { id: 't10', name: 'Multi-Channel Bot', description: 'Listen on Slack, Discord, and Telegram simultaneously. Route messages to AI, respond across all channels.', category: 'Support', icon: '🤖', is_premium: true, uses: 334,
    nodes: [
      { id: 'n1', type: 'event', category: 'triggers', label: 'Any Channel Message', icon: '⚡', position: { x: 200, y: 50 }, config: {} },
      { id: 'n2', type: 'extract', category: 'ai', label: 'Parse Intent', icon: '🔍', position: { x: 200, y: 180 }, config: {} },
      { id: 'n3', type: 'llm_call', category: 'ai', label: 'Generate Response', icon: '🧠', position: { x: 200, y: 310 }, config: { model: 'GPT-4o' } },
      { id: 'n4', type: 'switch', category: 'conditions', label: 'Route by Channel', icon: '🔃', position: { x: 200, y: 440 }, config: {} },
      { id: 'n5', type: 'slack', category: 'integrations', label: 'Reply Slack', icon: '💼', position: { x: 60, y: 570 }, config: {} },
      { id: 'n6', type: 'send_message', category: 'actions', label: 'Reply Discord', icon: '📤', position: { x: 200, y: 570 }, config: {} },
      { id: 'n7', type: 'telegram', category: 'integrations', label: 'Reply Telegram', icon: '💬', position: { x: 340, y: 570 }, config: {} },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }, { id: 'e4', source: 'n4', target: 'n5' }, { id: 'e5', source: 'n4', target: 'n6' }, { id: 'e6', source: 'n4', target: 'n7' }]
  },
]

const CATEGORIES = ['All', 'Support', 'Social', 'Automation', 'Data', 'Content', 'Sales', 'Research']

export default function TemplatesPage() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const filtered = TEMPLATES.filter(t => {
    if (category !== 'All' && t.category !== category) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function isTemplateLocked(template: TemplateData): boolean {
    if (isPro) return false
    return TEMPLATE_PLAN_MAP[template.id] === 'pro'
  }

  async function useTemplate(template: TemplateData) {
    if (isTemplateLocked(template)) {
      setShowUpgrade(true)
      return
    }
    if (user) {
      try {
        const { data } = await supabase.from('agent_projects').insert({
          user_id: user.id, name: `${template.name} Agent`, description: template.description,
          template_id: template.id, nodes: template.nodes, edges: template.edges, status: 'draft'
        }).select().single()
        if (data) { router.push(`/builder?project=${data.id}`); return }
      } catch { /* fallback to sessionStorage */ }
    }
    sessionStorage.setItem('template', JSON.stringify(template))
    router.push('/builder')
  }

  return (
    <div className="min-h-screen pt-24 px-6 max-w-6xl mx-auto pb-20">
      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgrade(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upgrade to Pro</h3>
              <p className="text-gray-400 mb-6">This template requires a Pro plan. Unlock all templates, export formats, and unlimited runs for just $29/mo.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowUpgrade(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition border border-white/10">
                  Maybe Later
                </button>
                <Link href="/pricing" className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition text-center font-medium">
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Agent Templates</h1>
        <p className="text-gray-500 text-lg">Start from a proven blueprint. Customize to your needs.</p>
        {!isPro && (
          <p className="text-xs text-gray-600 mt-2">🔓 3 templates free · <Link href="/pricing" className="text-purple-400 hover:text-purple-300">Upgrade to Pro</Link> for all templates</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${category === cat ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(template => {
          const locked = isTemplateLocked(template)
          return (
            <div key={template.id} className={`bg-gray-900 rounded-xl border p-5 transition group ${locked ? 'border-white/5 opacity-80 hover:opacity-100 hover:border-amber-500/30' : 'border-white/10 hover:border-purple-500/30'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition flex items-center gap-2">
                      {template.name}
                      {locked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                    </h3>
                    <span className="text-xs text-gray-500">{template.category}</span>
                  </div>
                </div>
                {locked ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Pro</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Free</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{template.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{template.nodes.length} nodes</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {template.uses.toLocaleString()}</span>
                </div>
                <button onClick={() => useTemplate(template)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition hover:opacity-90 ${locked ? 'bg-amber-600' : ''}`} style={locked ? {} : { background: '#8b5cf6' }}>
                  {locked ? 'Upgrade' : 'Use'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500">No templates match your search.</p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-white/[0.06] text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Bot className="w-4 h-4 text-purple-500" />
          <a href="https://miyamotolabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">Powered by Miyamoto Labs</a>
        </div>
      </footer>
    </div>
  )
}
