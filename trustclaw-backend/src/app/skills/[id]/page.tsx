'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Header from '@/components/Header'
import { 
  Shield, Download, User, GitBranch, AlertTriangle, CheckCircle, 
  Copy, Flag, ExternalLink, ArrowLeft, Loader2, Calendar, Tag,
  Star, MessageSquare
} from 'lucide-react'
import type { Skill, Review } from '@/types/database'

export default function SkillDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [skill, setSkill] = useState<Skill | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchSkill = useCallback(async () => {
    try {
      const [skillRes, reviewsRes] = await Promise.all([
        fetch(`/api/skills/${id}`),
        fetch(`/api/skills/${id}/reviews`),
      ])
      if (!skillRes.ok) { router.push('/skills'); return }
      const skillData = await skillRes.json()
      setSkill(skillData.skill)
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        setReviews(reviewsData.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching skill:', error)
      router.push('/skills')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchSkill()
  }, [fetchSkill])

  const copyInstallCommand = () => {
    const command = `openclaw skill install ${skill?.name}`
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-trust-green" />
        </div>
      </>
    )
  }

  if (!skill) {
    return (
      <>
        <Header />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Skill Not Found</h1>
        </div>
      </>
    )
  }

  const latestScan = skill.scans?.[0]

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-dark-muted hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Skills
        </button>

        {/* Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-trust-green/10 rounded-xl flex items-center justify-center">
                <Shield className="h-8 w-8 text-trust-green" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">{skill.name}</h1>
                <div className="flex items-center gap-3 text-dark-muted flex-wrap">
                  <span>v{skill.version}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{skill.publisher?.display_name || 'Unknown'}</span>
                    {skill.publisher?.verified && (
                      <CheckCircle className="h-3 w-3 text-trust-green" />
                    )}
                  </div>
                  {reviews.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400">{avgRating.toFixed(1)}</span>
                        <span className="text-dark-muted">({reviews.length})</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className={`badge badge-${skill.status} text-sm`}>
                {skill.status.charAt(0).toUpperCase() + skill.status.slice(1)}
              </span>
              {skill.scan_result && (
                <span className={`badge badge-${skill.scan_result} text-sm`}>
                  Scan: {skill.scan_result.charAt(0).toUpperCase() + skill.scan_result.slice(1)}
                </span>
              )}
            </div>
          </div>

          <p className="text-dark-muted mt-6 mb-6">
            {skill.description || 'No description provided.'}
          </p>

          {/* Tags */}
          {skill.tags && skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {skill.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-dark-bg px-3 py-1 rounded-full text-dark-muted border border-dark-border">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Install command */}
          <div className="bg-dark-bg rounded-lg p-4 flex items-center justify-between">
            <code className="text-trust-green text-sm">
              openclaw skill install {skill.name}
            </code>
            <button
              onClick={copyInstallCommand}
              className="flex items-center gap-2 text-dark-muted hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 text-trust-green" />
                  <span className="text-trust-green text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center py-4">
            <Download className="h-5 w-5 text-trust-green mx-auto mb-2" />
            <div className="text-xl font-bold">{skill.downloads.toLocaleString()}</div>
            <div className="text-dark-muted text-sm">Downloads</div>
          </div>
          <div className="card text-center py-4">
            <Star className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
            <div className="text-dark-muted text-sm">Rating</div>
          </div>
          <div className="card text-center py-4">
            <Calendar className="h-5 w-5 text-trust-green mx-auto mb-2" />
            <div className="text-xl font-bold">
              {new Date(skill.created_at).toLocaleDateString()}
            </div>
            <div className="text-dark-muted text-sm">Published</div>
          </div>
          <div className="card text-center py-4">
            <Tag className="h-5 w-5 text-trust-green mx-auto mb-2" />
            <div className="text-xl font-bold capitalize">{skill.category || 'General'}</div>
            <div className="text-dark-muted text-sm">Category</div>
          </div>
        </div>

        {/* Links */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Links</h2>
          <div className="space-y-3">
            {skill.git_url && (
              <a
                href={skill.git_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-dark-muted hover:text-trust-green transition-colors"
              >
                <GitBranch className="h-5 w-5" />
                <span>View Source Code</span>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </a>
            )}
            {skill.publisher?.github_username && (
              <a
                href={`https://github.com/${skill.publisher.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-dark-muted hover:text-trust-green transition-colors"
              >
                <User className="h-5 w-5" />
                <span>@{skill.publisher.github_username}</span>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </a>
            )}
          </div>
        </div>

        {/* Scan Results */}
        {latestScan && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-4">Latest Security Scan</h2>
            <div className="flex items-center gap-3 mb-4">
              {latestScan.result === 'pass' && <CheckCircle className="h-5 w-5 text-trust-green" />}
              {latestScan.result === 'warn' && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
              {latestScan.result === 'fail' && <AlertTriangle className="h-5 w-5 text-red-400" />}
              <span className={`badge badge-${latestScan.result}`}>
                {latestScan.result.toUpperCase()}
              </span>
              <span className="text-dark-muted text-sm">
                {new Date(latestScan.scanned_at).toLocaleString()}
              </span>
            </div>

            {latestScan.findings && latestScan.findings.length > 0 ? (
              <div className="space-y-2">
                {latestScan.findings.map((finding, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-sm ${
                      finding.severity === 'critical' || finding.severity === 'high'
                        ? 'bg-red-500/10 border border-red-500/20'
                        : finding.severity === 'medium'
                        ? 'bg-yellow-500/10 border border-yellow-500/20'
                        : 'bg-blue-500/10 border border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{finding.category}</span>
                      <span className="text-xs opacity-60">{finding.severity}</span>
                    </div>
                    <p className="text-dark-muted">{finding.message}</p>
                    {finding.file && (
                      <p className="text-xs text-dark-muted mt-1 font-mono">
                        {finding.file}:{finding.line}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-trust-green">✓ No security issues detected</p>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reviews ({reviews.length})
            </h2>
            {avgRating > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} />
                <span className="text-dark-muted text-sm">{avgRating.toFixed(1)} avg</span>
              </div>
            )}
          </div>

          {/* Write review */}
          {isConnected && (
            <ReviewForm
              skillId={id}
              walletAddress={address!}
              onSubmitted={(review) => setReviews(prev => [review, ...prev.filter(r => r.publisher_id !== review.publisher_id)])}
            />
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-dark-muted">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No reviews yet. Be the first to review this skill!</p>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-dark-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-dark-muted" />
                      <span className="font-medium text-sm">
                        {review.publisher?.display_name || 'Anonymous'}
                      </span>
                      {review.publisher?.verified && (
                        <CheckCircle className="h-3 w-3 text-trust-green" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-dark-muted text-xs">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-dark-muted text-sm">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 text-dark-muted hover:text-red-400 transition-colors"
          >
            <Flag className="h-4 w-4" />
            Report this skill
          </button>
        </div>

        {/* Report Modal */}
        {showReportModal && (
          <ReportModal skillId={skill.id} onClose={() => setShowReportModal(false)} />
        )}
      </main>
    </>
  )
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-dark-border'
          }`}
        />
      ))}
    </div>
  )
}

function ReviewForm({ 
  skillId, walletAddress, onSubmitted 
}: { 
  skillId: string; walletAddress: string; onSubmitted: (review: Review) => void 
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/skills/${skillId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, rating, comment }),
      })
      if (res.ok) {
        const data = await res.json()
        onSubmitted(data.review)
        setSubmitted(true)
        setComment('')
        setTimeout(() => setSubmitted(false), 3000)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-dark-bg rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-dark-muted">Your rating:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-5 w-5 ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-dark-border'
                }`}
              />
            </button>
          ))}
        </div>
        {submitted && (
          <span className="text-trust-green text-sm flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Saved!
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input flex-1"
          placeholder="Write a review (optional)..."
        />
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="btn-trust px-4 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
        </button>
      </div>
    </form>
  )
}

function ReportModal({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [wallet, setWallet] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch(`/api/skills/${skillId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: wallet, reason, description }),
      })
      setSubmitted(true)
      setTimeout(onClose, 2000)
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-trust-green mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report Submitted</h3>
            <p className="text-dark-muted">Thank you for helping keep TrustClaw safe.</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-4">Report Skill</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-dark-muted mb-2">Your Wallet</label>
                <input
                  type="text"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  className="input"
                  placeholder="Your wallet address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-2">Reason</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="input" required>
                  <option value="">Select a reason</option>
                  <option value="malicious">Malicious code</option>
                  <option value="security">Security vulnerability</option>
                  <option value="spam">Spam or misleading</option>
                  <option value="copyright">Copyright violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-dark-border rounded-lg hover:border-trust-green/50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 btn-trust bg-red-500 hover:bg-red-600">
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
