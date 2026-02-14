'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoSVG from '@/components/LogoSVG'
import { supabase } from '@/lib/supabase'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookie = parts.pop()?.split(';').shift() || null
    return cookie ? decodeURIComponent(cookie) : null
  }
  return null
}

type Conversation = {
  id: string
  property_id: string
  guest_phone: string
  message: string
  response: string
  timestamp: string
  properties: { name: string; org_id: string }
}

type Escalation = {
  id: string
  property_id: string
  guest_phone: string
  message: string
  ai_response: string
  reason: string
  status: string
  created_at: string
  properties: { name: string }
}

export default function ConversationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [tab, setTab] = useState<'conversations' | 'escalations' | 'faq'>('conversations')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004'

  useEffect(() => {
    const userId = getCookie('user_id')
    if (!userId) { router.push('/login'); return }
    
    async function init() {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
      
      if (orgs?.[0]) {
        setOrgId(orgs[0].id)
        const { data: props } = await supabase
          .from('properties')
          .select('id, name')
          .eq('org_id', orgs[0].id)
        setProperties(props || [])
      }
    }
    init()
  }, [router])

  useEffect(() => {
    if (orgId) loadData()
  }, [orgId, selectedProperty, dateFrom, dateTo])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (orgId) params.set('orgId', orgId)
      if (selectedProperty !== 'all') params.set('propertyId', selectedProperty)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const [convRes, escRes] = await Promise.all([
        fetch(`${BACKEND}/api/conversations?${params}`),
        fetch(`${BACKEND}/api/escalations?${params}`)
      ])

      setConversations(await convRes.json())
      setEscalations(await escRes.json())
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  const resolveEscalation = async (id: string) => {
    await fetch(`${BACKEND}/api/escalations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' })
    })
    loadData()
  }

  // Compute FAQ from conversations
  const faqCategories = (() => {
    const cats: Record<string, number> = {}
    const patterns: Record<string, RegExp> = {
      'WiFi & Internet': /wifi|internet|password|network/i,
      'Check-in/out': /check.?in|check.?out|key|door|code|arrival/i,
      'Local Tips': /restaurant|eat|food|bar|cafe|attraction|visit/i,
      'Transport': /parking|bus|taxi|uber|transport|airport/i,
      'Amenities': /pool|gym|sauna|laundry|washing|towel/i,
      'Rules': /rule|noise|quiet|smoking|pet|party/i,
      'Weather': /weather|rain|temperature|cold|warm/i,
    }
    conversations.forEach(c => {
      for (const [cat, pat] of Object.entries(patterns)) {
        if (pat.test(c.message)) {
          cats[cat] = (cats[cat] || 0) + 1
        }
      }
    })
    return Object.entries(cats).sort((a, b) => b[1] - a[1])
  })()

  const pendingEscalations = escalations.filter(e => e.status === 'pending')

  return (
    <div className="min-h-screen bg-bg">
      <header className="px-4 sm:px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-primary font-bold">← Dashboard</Link>
            <Link href="/dashboard/analytics" className="text-sm text-muted hover:text-primary font-bold">📊 Analytics</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        <h1 className="font-nunito text-3xl font-black mb-2">Conversations</h1>
        <p className="text-muted mb-6">View all guest conversations and escalations</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 border-[rgba(108,92,231,0.1)] bg-white text-sm font-bold"
          >
            <option value="all">All Properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 border-[rgba(108,92,231,0.1)] bg-white text-sm" placeholder="From" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 border-[rgba(108,92,231,0.1)] bg-white text-sm" placeholder="To" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['conversations', 'escalations', 'faq'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                tab === t ? 'bg-primary text-white' : 'bg-white text-dark hover:bg-[rgba(108,92,231,0.1)]'
              }`}>
              {t === 'conversations' && `💬 Conversations (${conversations.length})`}
              {t === 'escalations' && `🚨 Escalations (${pendingEscalations.length})`}
              {t === 'faq' && '❓ Most Asked'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Conversations Tab */}
            {tab === 'conversations' && (
              <div className="space-y-3">
                {conversations.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-card p-8 text-center text-muted">No conversations yet</div>
                ) : conversations.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl shadow-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-accent-soft text-accent px-2 py-1 rounded-full font-bold">{c.properties?.name}</span>
                        <span className="text-xs text-muted">{c.guest_phone}</span>
                      </div>
                      <span className="text-xs text-muted">{new Date(c.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-bold text-muted">Guest:</span>
                      <p className="text-sm text-dark">{c.message}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted">AI Response:</span>
                      <p className="text-sm text-muted">{c.response?.substring(0, 200)}{c.response?.length > 200 ? '...' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Escalations Tab */}
            {tab === 'escalations' && (
              <div className="space-y-3">
                {escalations.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-card p-8 text-center text-muted">No escalations</div>
                ) : escalations.map(e => (
                  <div key={e.id} className={`bg-white rounded-2xl shadow-card p-4 border-l-4 ${
                    e.status === 'pending' ? 'border-l-accent' : 'border-l-mint'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          e.status === 'pending' ? 'bg-accent-soft text-accent' : 'bg-[#E0FFF0] text-mint-dark'
                        }`}>{e.status}</span>
                        <span className="text-xs text-muted">{e.reason}</span>
                        <span className="text-xs text-muted">{e.properties?.name}</span>
                      </div>
                      <span className="text-xs text-muted">{new Date(e.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-bold mb-1">Guest ({e.guest_phone}): {e.message}</p>
                    <p className="text-sm text-muted mb-3">{e.ai_response?.substring(0, 150)}</p>
                    {e.status === 'pending' && (
                      <button onClick={() => resolveEscalation(e.id)}
                        className="text-xs bg-mint text-white px-4 py-1.5 rounded-full font-bold hover:bg-mint-dark transition-all">
                        ✅ Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* FAQ Tab */}
            {tab === 'faq' && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-nunito text-lg font-black mb-4">Most Asked Question Categories</h3>
                {faqCategories.length === 0 ? (
                  <p className="text-muted">Not enough data yet</p>
                ) : (
                  <div className="space-y-3">
                    {faqCategories.map(([cat, count]) => {
                      const max = faqCategories[0][1] as number
                      const pct = Math.round((count / max) * 100)
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold">{cat}</span>
                            <span className="text-muted">{count} questions</span>
                          </div>
                          <div className="h-3 bg-[rgba(108,92,231,0.1)] rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
