'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import Header from '@/components/Header'
import WalletButton from '@/components/wallet-button'
import { 
  Wallet, User, Github, Shield, Coins, CheckCircle, 
  Loader2, ExternalLink, Package, Trash2, Edit3, X,
  DollarSign, TrendingUp, Download
} from 'lucide-react'
import { truncateAddress } from '@/lib/wagmi'
import type { Publisher, Skill } from '@/types/database'

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const [publisher, setPublisher] = useState<Publisher | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [githubUsername, setGithubUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const res = await fetch(`/api/publishers/${address}`)
      if (res.ok) {
        const data = await res.json()
        setPublisher(data.publisher)
        setSkills(data.skills || [])
        setShowRegister(false)
      } else if (res.status === 404) {
        setShowRegister(true)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (isConnected && address) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [isConnected, address, fetchProfile])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return
    setRegistering(true)
    try {
      const res = await fetch('/api/publishers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          github_username: githubUsername || null,
          display_name: displayName || null,
        }),
      })
      if (res.ok) {
        await fetchProfile()
      }
    } catch (error) {
      console.error('Error registering:', error)
    } finally {
      setRegistering(false)
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!address) return
    setActionLoading(skillId)
    try {
      const res = await fetch(`/api/publishers/${address}/skills/${skillId}`, { method: 'DELETE' })
      if (res.ok) {
        setSkills(prev => prev.filter(s => s.id !== skillId))
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting skill:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditSkill = async (skillId: string, updates: Partial<Skill>) => {
    if (!address) return
    setActionLoading(skillId)
    try {
      const res = await fetch(`/api/publishers/${address}/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const data = await res.json()
        setSkills(prev => prev.map(s => s.id === skillId ? { ...s, ...data.skill } : s))
        setEditingSkill(null)
      }
    } catch (error) {
      console.error('Error updating skill:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // Mock earnings data
  const totalDownloads = skills.reduce((sum, s) => sum + (s.downloads || 0), 0)
  const mockEarnings = (totalDownloads * 0.01).toFixed(2)
  const mockMonthlyEarnings = (totalDownloads * 0.003).toFixed(2)

  if (!isConnected) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20">
          <div className="card text-center">
            <Wallet className="h-16 w-16 text-trust-green mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
            <p className="text-dark-muted mb-8">
              Connect your wallet to view your publisher profile and submitted skills.
            </p>
            <WalletButton />
          </div>
        </main>
      </>
    )
  }

  if (loading) {
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

  if (showRegister) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20">
          <div className="card">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-trust-green mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Create Publisher Profile</h1>
              <p className="text-dark-muted mt-2">
                Set up your profile to start publishing skills.
              </p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <div className="flex items-center gap-3 p-3 bg-dark-bg border border-dark-border rounded-lg">
                  <Wallet className="h-5 w-5 text-trust-green" />
                  <span className="font-mono text-sm text-trust-green">
                    {truncateAddress(address || '')}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                  placeholder="Your name or pseudonym"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub Username (optional)
                  </div>
                </label>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="input"
                  placeholder="your-github-username"
                />
              </div>
              <button
                type="submit"
                disabled={registering}
                className="btn-trust w-full py-3 flex items-center justify-center gap-2"
              >
                {registering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Create Profile
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Earnings Banner */}
        <div className="card mb-8 bg-gradient-to-r from-trust-green/10 to-transparent border-trust-green/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-dark-muted text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Total Earnings
              </div>
              <div className="text-2xl font-bold text-trust-green">${mockEarnings}</div>
              <div className="text-xs text-dark-muted">USDC (lifetime)</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-dark-muted text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                This Month
              </div>
              <div className="text-2xl font-bold">${mockMonthlyEarnings}</div>
              <div className="text-xs text-dark-muted">USDC</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-dark-muted text-sm mb-1">
                <Download className="h-4 w-4" />
                Total Downloads
              </div>
              <div className="text-2xl font-bold">{totalDownloads.toLocaleString()}</div>
              <div className="text-xs text-dark-muted">across all skills</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-dark-muted text-sm mb-1">
                <Package className="h-4 w-4" />
                Published Skills
              </div>
              <div className="text-2xl font-bold">{skills.length}</div>
              <div className="text-xs text-dark-muted">{skills.filter(s => s.status === 'verified').length} verified</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="card">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-trust-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-trust-green" />
                </div>
                <h2 className="text-xl font-bold">
                  {publisher?.display_name || 'Publisher'}
                </h2>
                {publisher?.github_username && (
                  <a
                    href={`https://github.com/${publisher.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dark-muted hover:text-trust-green transition-colors inline-flex items-center gap-1 mt-1"
                  >
                    <Github className="h-4 w-4" />
                    @{publisher.github_username}
                  </a>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                  <span className="text-dark-muted text-sm">Wallet</span>
                  <span className="font-mono text-sm">
                    {truncateAddress(publisher?.wallet_address || '')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                  <span className="text-dark-muted text-sm">Verified</span>
                  {publisher?.verified ? (
                    <span className="badge badge-verified">Yes</span>
                  ) : (
                    <span className="badge badge-pending">No</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                  <span className="text-dark-muted text-sm">Reputation</span>
                  <span className="text-trust-green font-bold">
                    {publisher?.reputation_score || 0}
                  </span>
                </div>
              </div>

              {/* Staking Section */}
              <div className="mt-6 pt-6 border-t border-dark-border">
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="h-5 w-5 text-trust-green" />
                  <span className="font-semibold">$TCLAW Staking</span>
                  <span className="badge badge-pending text-xs">Coming Soon</span>
                </div>
                <div className="p-4 bg-dark-bg rounded-lg mb-4">
                  <div className="text-dark-muted text-sm mb-1">Staked Amount</div>
                  <div className="text-2xl font-bold">
                    {publisher?.stake_amount || 0} <span className="text-trust-green text-lg">$TCLAW</span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full bg-dark-border text-dark-muted py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Shield className="h-5 w-5" />
                  Stake to Verify
                </button>
                <p className="text-dark-muted text-xs text-center mt-2">
                  Staking unlocks priority reviews and verified badge
                </p>
              </div>
            </div>
          </div>

          {/* Skills List */}
          <div className="md:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Your Skills</h3>
                <a href="/submit" className="btn-trust text-sm">
                  Submit New
                </a>
              </div>

              {skills.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-dark-muted mx-auto mb-4" />
                  <p className="text-dark-muted">No skills submitted yet</p>
                  <a href="/submit" className="text-trust-green hover:underline mt-2 inline-block">
                    Submit your first skill →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div key={skill.id}>
                      <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <a href={`/skills/${skill.id}`} className="font-medium hover:text-trust-green transition-colors">
                              {skill.name}
                            </a>
                            <span className="text-dark-muted text-xs">v{skill.version}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-dark-muted text-xs">
                            {skill.category && <span className="capitalize">{skill.category}</span>}
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {skill.downloads || 0}
                            </span>
                            <span>{new Date(skill.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`badge badge-${skill.status}`}>
                            {skill.status}
                          </span>
                          {skill.scan_result && (
                            <span className={`badge badge-${skill.scan_result}`}>
                              {skill.scan_result}
                            </span>
                          )}
                          <button
                            onClick={() => setEditingSkill(skill)}
                            className="p-2 text-dark-muted hover:text-white transition-colors rounded-lg hover:bg-dark-card"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          {skill.git_url && (
                            <a
                              href={skill.git_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-dark-muted hover:text-white transition-colors rounded-lg hover:bg-dark-card"
                              title="View source"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {deleteConfirm === skill.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteSkill(skill.id)}
                                disabled={actionLoading === skill.id}
                                className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30"
                              >
                                {actionLoading === skill.id ? '...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs text-dark-muted px-2 py-1 rounded hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(skill.id)}
                              className="p-2 text-dark-muted hover:text-red-400 transition-colors rounded-lg hover:bg-dark-card"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingSkill && (
          <EditSkillModal
            skill={editingSkill}
            loading={actionLoading === editingSkill.id}
            onSave={(updates) => handleEditSkill(editingSkill.id, updates)}
            onClose={() => setEditingSkill(null)}
          />
        )}
      </main>
    </>
  )
}

function EditSkillModal({ 
  skill, loading, onSave, onClose 
}: { 
  skill: Skill; loading: boolean; onSave: (updates: Partial<Skill>) => void; onClose: () => void 
}) {
  const [description, setDescription] = useState(skill.description || '')
  const [version, setVersion] = useState(skill.version)
  const [category, setCategory] = useState(skill.category || '')
  const [tags, setTags] = useState(skill.tags?.join(', ') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      description,
      version,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean) as unknown as string[],
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Edit {skill.name}</h3>
          <button onClick={onClose} className="text-dark-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-muted mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-2">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              <option value="">None</option>
              <option value="automation">Automation</option>
              <option value="integration">Integration</option>
              <option value="utility">Utility</option>
              <option value="data">Data</option>
              <option value="security">Security</option>
              <option value="ai">AI & ML</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-2">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input"
              placeholder="comma, separated, tags"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-dark-border rounded-lg hover:border-trust-green/50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-trust flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
