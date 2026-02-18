import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

interface Organization {
  id: string
  name: string
  email?: string
  subscription_status?: string
  plan?: string
  created_at: string
  trial_ends_at?: string
}

export default async function CustomersPage() {
  const session = await requireAdminSession()
  if (!session) redirect('/admin/login')

  const supabase = getAdminSupabase()
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, email, subscription_status, plan, created_at, trial_ends_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const organizations = (orgs as Organization[] | null) ?? []

  const statusColors: Record<string, string> = {
    trialing: 'bg-amber-900/50 text-amber-300 border-amber-800',
    active: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
    cancelled: 'bg-slate-700/50 text-slate-400 border-slate-600',
    churned: 'bg-red-900/50 text-red-400 border-red-800',
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold">Customers</h1>
        <p className="text-slate-400 text-sm mt-1">All organizations using HeyConcierge</p>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {organizations.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-slate-500 py-12 text-sm">
                  No customers yet
                </td>
              </tr>
            ) : (
              organizations.map((org) => (
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
