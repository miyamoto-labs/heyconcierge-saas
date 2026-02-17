import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  mfa_enabled: boolean
  last_login_at?: string
  created_at: string
}

export default async function AdminUsersPage() {
  const session = await requireAdminSession()
  if (!session) redirect('/admin/login')

  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('admin_users')
    .select('id, name, email, role, mfa_enabled, last_login_at, created_at')
    .order('created_at', { ascending: false })

  const users = (data as AdminUser[] | null) ?? []

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-900/50 text-purple-300 border-purple-800',
    admin: 'bg-blue-900/50 text-blue-300 border-blue-800',
    support: 'bg-slate-700/50 text-slate-300 border-slate-600',
    finance: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold">Admin Users</h1>
        <p className="text-slate-400 text-sm mt-1">Internal HeyConcierge team members</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                User
              </th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                Role
              </th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                MFA
              </th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">
                Last login
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-slate-500 py-12 text-sm">
                  No admin users yet
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-white text-sm font-medium">{user.name}</p>
                    <p className="text-slate-500 text-xs">{user.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                        roleColors[user.role] || roleColors.support
                      }`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs font-medium ${
                        user.mfa_enabled ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {user.mfa_enabled ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-400 text-sm">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Never'}
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
