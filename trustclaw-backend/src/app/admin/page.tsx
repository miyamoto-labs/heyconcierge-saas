'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Header from '@/components/Header'
import WalletButton from '@/components/wallet-button'
import { 
  CheckCircle, XCircle, 
  Loader2, Play, RefreshCw, ExternalLink, ChevronDown, ChevronUp, Wallet, AlertTriangle
} from 'lucide-react'
import { isAdminWallet, truncateAddress } from '@/lib/wagmi'
import type { Skill } from '@/types/database'

interface Stats {
  skills: {
    total: number
    pending: number
    scanning: number
    verified: number
    rejected: number
    blocked: number
  }
  publishers: number
  totalDownloads: number
  pendingReports: number
  recentSubmissions: number
}

export default function AdminPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const isAdmin = isAdminWallet(address)
  const wallet = address || ''
  
  const [skills, setSkills] = useState<Skill[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('pending')
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  const fetchInitialData = useCallback(async () => {
    if (!wallet) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-wallet-address': wallet },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }, [wallet])

  // Auto-authenticate when wallet is connected and is admin
  useEffect(() => {
    if (isConnected && isAdmin && initialLoad) {
      setInitialLoad(false)
      fetchInitialData()
    }
  }, [isConnected, isAdmin, initialLoad, fetchInitialData])

  const fetchSkills = useCallback(async () => {
    try {
      const params = filter ? `?status=${filter}` : ''
      const res = await fetch(`/api/admin/skills${params}`, {
        headers: { 'x-wallet-address': wallet },
      })
      if (res.ok) {
        const data = await res.json()
        setSkills(data.skills || [])
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
    }
  }, [filter, wallet])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-wallet-address': wallet },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    if (isConnected && isAdmin) {
      fetchSkills()
    }
  }, [filter, isConnected, isAdmin, fetchSkills])

  const handleScan = async (skillId: string) => {
    setActionLoading(skillId)
    try {
      await fetch(`/api/skills/${skillId}/scan`, {
        method: 'POST',
        headers: { 'x-wallet-address': wallet },
      })
      await fetchSkills()
      await fetchStats()
    } catch (error) {
      console.error('Scan error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async (skillId: string) => {
    setActionLoading(skillId)
    try {
      await fetch(`/api/skills/${skillId}/approve`, {
        method: 'POST',
        headers: { 'x-wallet-address': wallet },
      })
      await fetchSkills()
      await fetchStats()
    } catch (error) {
      console.error('Approve error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (skillId: string) => {
    const reason = prompt('Rejection reason (optional):')
    setActionLoading(skillId)
    try {
      await fetch(`/api/skills/${skillId}/reject`, {
        method: 'POST',
        headers: { 
          'x-wallet-address': wallet,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      await fetchSkills()
      await fetchStats()
    } catch (error) {
      console.error('Reject error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // Not connected - show connect wallet prompt
  if (!isConnected) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20">
          <div className="card text-center">
            <Wallet className="h-12 w-12 text-trust-green mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="text-dark-muted mt-4 mb-8">
              Connect your admin wallet to access the dashboard
            </p>
            <WalletButton />
          </div>
        </main>
      </>
    )
  }

  // Connected but not admin - show unauthorized
  if (!isAdmin) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20">
          <div className="card text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Unauthorized</h1>
            <p className="text-dark-muted mt-4 mb-6">
              Your wallet is not authorized for admin access.
            </p>
            <div className="bg-dark-bg rounded-lg p-4 mb-6">
              <div className="text-dark-muted text-sm mb-1">Connected Wallet</div>
              <div className="font-mono text-sm">{truncateAddress(address || '')}</div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="btn-trust"
            >
              Return Home
            </button>
          </div>
        </main>
      </>
    )
  }

  // Loading initial data
  if (loading && !stats) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-20">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-trust-green" />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => { fetchSkills(); fetchStats(); }}
            className="flex items-center gap-2 text-dark-muted hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="card py-4 text-center">
              <div className="text-2xl font-bold text-trust-green">{stats.skills.total}</div>
              <div className="text-dark-muted text-sm">Total Skills</div>
            </div>
            <div className="card py-4 text-center border-yellow-500/30">
              <div className="text-2xl font-bold text-yellow-400">{stats.skills.pending}</div>
              <div className="text-dark-muted text-sm">Pending</div>
            </div>
            <div className="card py-4 text-center border-trust-green/30">
              <div className="text-2xl font-bold text-trust-green">{stats.skills.verified}</div>
              <div className="text-dark-muted text-sm">Verified</div>
            </div>
            <div className="card py-4 text-center border-red-500/30">
              <div className="text-2xl font-bold text-red-400">{stats.skills.rejected}</div>
              <div className="text-dark-muted text-sm">Rejected</div>
            </div>
            <div className="card py-4 text-center">
              <div className="text-2xl font-bold">{stats.publishers}</div>
              <div className="text-dark-muted text-sm">Publishers</div>
            </div>
            <div className="card py-4 text-center">
              <div className="text-2xl font-bold">{stats.pendingReports}</div>
              <div className="text-dark-muted text-sm">Reports</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'scanning', 'verified', 'rejected', 'blocked'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === 'all' ? '' : status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                (status === 'all' && !filter) || filter === status
                  ? 'bg-trust-green text-dark-bg'
                  : 'bg-dark-card border border-dark-border text-dark-muted hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Skills Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  <th className="table-header">Skill</th>
                  <th className="table-header">Publisher</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Scan</th>
                  <th className="table-header">Submitted</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {skills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-dark-muted">
                      No skills found
                    </td>
                  </tr>
                ) : (
                  skills.map((skill) => (
                    <>
                      <tr key={skill.id} className="hover:bg-dark-bg/50">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setExpandedSkill(
                                expandedSkill === skill.id ? null : skill.id
                              )}
                              className="text-dark-muted hover:text-white"
                            >
                              {expandedSkill === skill.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                            <div>
                              <div className="font-medium">{skill.name}</div>
                              <div className="text-dark-muted text-sm">v{skill.version}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm">
                            {skill.publisher?.display_name || 'Unknown'}
                          </div>
                          {skill.publisher?.github_username && (
                            <div className="text-dark-muted text-xs">
                              @{skill.publisher.github_username}
                            </div>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className={`badge badge-${skill.status}`}>
                            {skill.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          {skill.scan_result ? (
                            <span className={`badge badge-${skill.scan_result}`}>
                              {skill.scan_result}
                            </span>
                          ) : (
                            <span className="text-dark-muted text-sm">Not scanned</span>
                          )}
                        </td>
                        <td className="table-cell text-dark-muted text-sm">
                          {new Date(skill.created_at).toLocaleDateString()}
                        </td>
                        <td className="table-cell">
                          <div className="flex justify-end gap-2">
                            {actionLoading === skill.id ? (
                              <Loader2 className="h-5 w-5 animate-spin text-trust-green" />
                            ) : (
                              <>
                                <button
                                  onClick={() => handleScan(skill.id)}
                                  className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                  title="Run Scan"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                                {skill.status !== 'verified' && (
                                  <button
                                    onClick={() => handleApprove(skill.id)}
                                    className="p-2 rounded-lg bg-trust-green/10 text-trust-green hover:bg-trust-green/20 transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                {skill.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleReject(skill.id)}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                )}
                                {skill.git_url && (
                                  <a
                                    href={skill.git_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-dark-bg text-dark-muted hover:text-white transition-colors"
                                    title="View Source"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row */}
                      {expandedSkill === skill.id && (
                        <tr key={`${skill.id}-expanded`}>
                          <td colSpan={6} className="bg-dark-bg/50 px-6 py-4">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-dark-muted text-sm">
                                  {skill.description || 'No description'}
                                </p>
                                {skill.git_url && (
                                  <div className="mt-4">
                                    <h4 className="font-medium mb-2">Repository</h4>
                                    <a 
                                      href={skill.git_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-trust-green text-sm hover:underline"
                                    >
                                      {skill.git_url}
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Scan Results</h4>
                                {skill.scans && skill.scans.length > 0 ? (
                                  <div className="space-y-2">
                                    {skill.scans[0].findings?.slice(0, 5).map((finding, i) => (
                                      <div
                                        key={i}
                                        className={`p-2 rounded text-xs ${
                                          finding.severity === 'critical' || finding.severity === 'high'
                                            ? 'bg-red-500/10 text-red-400'
                                            : finding.severity === 'medium'
                                            ? 'bg-yellow-500/10 text-yellow-400'
                                            : 'bg-blue-500/10 text-blue-400'
                                        }`}
                                      >
                                        <span className="font-medium">[{finding.severity}]</span>{' '}
                                        {finding.message}
                                      </div>
                                    ))}
                                    {skill.scans[0].findings?.length === 0 && (
                                      <p className="text-trust-green text-sm">✓ No issues found</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-dark-muted text-sm">No scans yet</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
