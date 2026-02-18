'use client'
import { useState, useEffect, useCallback } from 'react'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  mfa_enabled: boolean
  frozen?: boolean
  last_login_at?: string
  created_at: string
}

const ROLES = ['super_admin', 'admin', 'support', 'finance'] as const
type Role = typeof ROLES[number]

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-900/50 text-purple-300 border-purple-800',
  admin: 'bg-blue-900/50 text-blue-300 border-blue-800',
  support: 'bg-slate-700/50 text-slate-300 border-slate-600',
  finance: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support: 'Support',
  finance: 'Finance',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('support')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ tempPassword: string; email: string } | null>(null)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Edit role
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState<Role>('support')
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    if (res.ok) setUsers(data.users ?? [])
    else setError(data.error ?? 'Failed to load users')
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
    })
    const data = await res.json()
    if (res.ok) {
      setInviteResult({ tempPassword: data.tempPassword, email: inviteEmail })
      setInviteEmail('')
      setInviteName('')
      setInviteRole('support')
      fetchUsers()
    } else {
      setError(data.error ?? 'Invite failed')
    }
    setInviting(false)
  }

  async function handleFreeze(user: AdminUser) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frozen: !user.frozen }),
    })
    if (res.ok) fetchUsers()
    else {
      const data = await res.json()
      setError(data.error ?? 'Failed to update user')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteTarget(null)
      fetchUsers()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to delete user')
    }
    setDeleting(false)
  }

  async function handleSaveRole() {
    if (!editTarget) return
    setSaving(true)
    const res = await fetch(`/api/admin/users/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editRole }),
    })
    if (res.ok) {
      setEditTarget(null)
      fetchUsers()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to update role')
    }
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold">Admin Users</h1>
        <p className="text-slate-400 text-sm mt-1">Internal HeyConcierge team members</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-red-600 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Invite form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">Invite new user</h2>
        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Full name"
            value={inviteName}
            onChange={e => setInviteName(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as Role)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="bg-white text-slate-900 font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-slate-100 disabled:opacity-50 transition whitespace-nowrap"
          >
            {inviting ? 'Inviting…' : 'Send invite'}
          </button>
        </form>
      </div>

      {/* Invite success — show temp password once */}
      {inviteResult && (
        <div className="mb-6 bg-emerald-950 border border-emerald-800 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-emerald-400 font-semibold text-sm mb-1">✓ User invited successfully</p>
              <p className="text-slate-400 text-sm">Share these credentials with <strong className="text-white">{inviteResult.email}</strong> — they will be asked to set up MFA on first login.</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-slate-400 text-sm">Temporary password:</span>
                <code className="bg-slate-800 text-white font-mono text-sm px-3 py-1.5 rounded-lg tracking-wider">
                  {inviteResult.tempPassword}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(inviteResult.tempPassword); }}
                  className="text-slate-400 hover:text-white text-xs transition"
                >
                  Copy
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-2">⚠ This password is only shown once. Copy it now.</p>
            </div>
            <button onClick={() => setInviteResult(null)} className="text-slate-600 hover:text-slate-300 text-lg shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">User</th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">Role</th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">MFA</th>
              <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">Last login</th>
              <th className="text-right text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-12 text-sm">Loading…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-12 text-sm">No admin users yet</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b border-slate-800/50 transition-colors ${user.frozen ? 'opacity-50' : 'hover:bg-slate-800/30'}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-white text-sm font-medium">{user.name}</p>
                        <p className="text-slate-500 text-xs">{user.email}</p>
                      </div>
                      {user.frozen && (
                        <span className="text-xs bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-md">Frozen</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${roleColors[user.role] ?? roleColors.support}`}>
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium ${user.mfa_enabled ? 'text-emerald-400' : 'text-red-400'}`}>
                      {user.mfa_enabled ? '✓ Enabled' : '✗ Not set up'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-sm">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Never'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit role */}
                      <button
                        onClick={() => { setEditTarget(user); setEditRole(user.role as Role) }}
                        className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
                      >
                        Edit
                      </button>
                      {/* Freeze / Unfreeze */}
                      <button
                        onClick={() => handleFreeze(user)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition ${
                          user.frozen
                            ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800'
                            : 'text-amber-400 hover:text-amber-300 bg-amber-950 hover:bg-amber-900 border border-amber-800'
                        }`}
                      >
                        {user.frozen ? 'Unfreeze' : 'Freeze'}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="text-xs text-red-400 hover:text-red-300 bg-red-950 hover:bg-red-900 border border-red-800 px-3 py-1.5 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit role modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-1">Edit access level</h3>
            <p className="text-slate-400 text-sm mb-5">{editTarget.name} · {editTarget.email}</p>
            <select
              value={editRole}
              onChange={e => setEditRole(e.target.value as Role)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg py-2.5 text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving}
                className="flex-1 bg-white text-slate-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-slate-100 disabled:opacity-50 transition"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-1">Delete user?</h3>
            <p className="text-slate-400 text-sm mb-5">
              This will permanently delete <strong className="text-white">{deleteTarget.name}</strong> ({deleteTarget.email}) and all their sessions. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg py-2.5 text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50 transition"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
