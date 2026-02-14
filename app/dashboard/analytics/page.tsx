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

type Analytics = {
  totalConversations: number
  conversationsPerWeek: Record<string, number>
  questionCategories: Record<string, number>
  languageDistribution: Record<string, number>
  satisfaction: { positive: number; negative: number; total: number; score: number | null }
  uniqueGuests: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [orgId, setOrgId] = useState<string | null>(null)
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
    if (orgId) loadAnalytics()
  }, [orgId, selectedProperty])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (orgId) params.set('orgId', orgId)
      if (selectedProperty !== 'all') params.set('propertyId', selectedProperty)
      
      const res = await fetch(`${BACKEND}/api/analytics?${params}`)
      setAnalytics(await res.json())
    } catch (err) {
      console.error('Analytics error:', err)
    }
    setLoading(false)
  }

  const weekData = analytics ? Object.entries(analytics.conversationsPerWeek).sort((a, b) => a[0].localeCompare(b[0])).slice(-12) : []
  const maxWeek = Math.max(...weekData.map(([, v]) => v), 1)
  const catData = analytics ? Object.entries(analytics.questionCategories).sort((a, b) => b[1] - a[1]) : []
  const langData = analytics ? Object.entries(analytics.languageDistribution).sort((a, b) => b[1] - a[1]) : []
  const totalLang = langData.reduce((s, [, v]) => s + v, 0) || 1

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
            <Link href="/dashboard/conversations" className="text-sm text-muted hover:text-primary font-bold">💬 Conversations</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-nunito text-3xl font-black mb-1">Analytics</h1>
            <p className="text-muted">Insights from your guest conversations</p>
          </div>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 border-[rgba(108,92,231,0.1)] bg-white text-sm font-bold"
          >
            <option value="all">All Properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : analytics ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Conversations', value: analytics.totalConversations, icon: '💬' },
                { label: 'Unique Guests', value: analytics.uniqueGuests, icon: '👤' },
                { label: 'Satisfaction', value: analytics.satisfaction.score !== null ? `${analytics.satisfaction.score}%` : 'N/A', icon: '⭐' },
                { label: 'Total Ratings', value: analytics.satisfaction.total, icon: '📊' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl shadow-card p-5">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="font-nunito text-2xl font-black text-dark">{stat.value}</div>
                  <div className="text-xs text-muted font-bold">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Conversations per Week */}
            <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
              <h3 className="font-nunito text-lg font-black mb-4">Conversations per Week</h3>
              {weekData.length === 0 ? (
                <p className="text-muted text-sm">No data yet</p>
              ) : (
                <div className="flex items-end gap-2 h-40">
                  {weekData.map(([week, count]) => (
                    <div key={week} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-dark">{count}</span>
                      <div className="w-full bg-primary rounded-t-lg transition-all" 
                        style={{ height: `${(count / maxWeek) * 100}%`, minHeight: '4px' }} />
                      <span className="text-[10px] text-muted">{week.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Question Categories */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-nunito text-lg font-black mb-4">Popular Question Categories</h3>
                {catData.length === 0 ? (
                  <p className="text-muted text-sm">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {catData.map(([cat, count]) => {
                      const pct = Math.round((count / (catData[0][1] as number)) * 100)
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold">{cat}</span>
                            <span className="text-muted">{count}</span>
                          </div>
                          <div className="h-2.5 bg-[rgba(108,92,231,0.1)] rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Language Distribution */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-nunito text-lg font-black mb-4">Language Distribution</h3>
                {langData.length === 0 ? (
                  <p className="text-muted text-sm">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {langData.map(([lang, count]) => {
                      const pct = Math.round((count / totalLang) * 100)
                      return (
                        <div key={lang} className="flex items-center gap-3">
                          <span className="text-sm font-bold w-24">{lang}</span>
                          <div className="flex-1 h-2.5 bg-[rgba(108,92,231,0.1)] rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted w-10 text-right">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Satisfaction */}
            {analytics.satisfaction.total > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-nunito text-lg font-black mb-4">Guest Satisfaction</h3>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-black text-primary">{analytics.satisfaction.score}%</div>
                    <div className="text-sm text-muted">Satisfaction Score</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👍</span>
                      <div className="flex-1 h-3 bg-[rgba(108,92,231,0.1)] rounded-full overflow-hidden">
                        <div className="h-full bg-mint rounded-full" style={{ width: `${(analytics.satisfaction.positive / analytics.satisfaction.total) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold">{analytics.satisfaction.positive}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👎</span>
                      <div className="flex-1 h-3 bg-[rgba(108,92,231,0.1)] rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(analytics.satisfaction.negative / analytics.satisfaction.total) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold">{analytics.satisfaction.negative}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center text-muted">Failed to load analytics</div>
        )}
      </div>
    </div>
  )
}
