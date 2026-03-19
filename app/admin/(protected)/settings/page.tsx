'use client'

import { useEffect, useState } from 'react'
import { PLAN_ORDER } from '@/lib/stripe/plans'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  premium: 'Premium',
}

export default function AdminSettingsPage() {
  const [visiblePlans, setVisiblePlans] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        const plans = data.settings?.visible_plans
        if (Array.isArray(plans)) {
          setVisiblePlans(plans)
        } else {
          setVisiblePlans([...PLAN_ORDER])
        }
      })
      .catch(() => setVisiblePlans([...PLAN_ORDER]))
      .finally(() => setLoading(false))
  }, [])

  async function togglePlan(plan: string) {
    const next = visiblePlans.includes(plan)
      ? visiblePlans.filter(p => p !== plan)
      : [...visiblePlans, plan]

    setVisiblePlans(next)
    setSaving(true)
    setSaved(false)

    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'visible_plans', value: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Save failed (${res.status})`)
        setVisiblePlans(visiblePlans)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      setError('Network error')
      setVisiblePlans(visiblePlans)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Platform-wide configuration
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white text-lg font-semibold mb-1">Visible pricing plans</h2>
        <p className="text-slate-400 text-sm mb-5">
          Toggle which plans users can see on the billing page. Hidden plans won&apos;t appear as options for new subscriptions.
        </p>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : (
          <div className="space-y-3">
            {PLAN_ORDER.map(plan => (
              <label
                key={plan}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <span className="text-slate-200 text-sm font-medium">
                  {PLAN_LABELS[plan] || plan}
                </span>
                <button
                  onClick={() => togglePlan(plan)}
                  disabled={saving}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    visiblePlans.includes(plan)
                      ? 'bg-purple-600'
                      : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      visiblePlans.includes(plan) ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        )}

        {saved && (
          <p className="text-emerald-400 text-sm mt-4">Settings saved</p>
        )}
        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}
