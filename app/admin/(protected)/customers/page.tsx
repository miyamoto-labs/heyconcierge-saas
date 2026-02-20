'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  email?: string
  subscription_status?: string
  plan?: string
  created_at: string
  trial_ends_at?: string
  trial_started_at?: string
  stripe_customer_id?: string
  is_pilot?: boolean
}

const statusColors: Record<string, string> = {
  trialing: 'bg-amber-900/50 text-amber-300 border-amber-800',
  active: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
  cancelled: 'bg-slate-700/50 text-slate-400 border-slate-600',
  churned: 'bg-red-900/50 text-red-400 border-red-800',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Organization[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/customers')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch customers')
      }
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filtered = customers.filter(org => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      org.name.toLowerCase().includes(q) ||
      (org.email && org.email.toLowerCase().includes(q)) ||
      (org.plan && org.plan.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-semibold">Customers</h1>
        <p className="text-slate-400 text-sm mt-1">All organizations using HeyConcierge</p>
      </div>

      {/* Search field */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or plan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-950 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                Organization
              </th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                Status
              </th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                Plan
              </th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                Joined
              </th>
              <th className="text-right text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-12 text-sm">
                  Loading customers...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-12 text-sm">
                  {search ? 'No customers match your search' : 'No customers yet'}
                </td>
              </tr>
            ) : (
              filtered.map((org) => (
                <tr key={org.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-white text-sm font-medium">{org.name}</p>
                    {org.email && <p className="text-slate-500 text-xs">{org.email}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    {org.subscription_status && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                          statusColors[org.subscription_status] || statusColors.cancelled
                        }`}
                      >
                        {org.subscription_status}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-300 text-sm capitalize">{org.plan || '—'}</span>
                    {org.is_pilot && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-800">
                        Pilot
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-400 text-sm">
                      {new Date(org.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/admin/customers/${org.id}`}
                        className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-slate-600 text-xs mt-3">
          Showing {filtered.length} of {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
