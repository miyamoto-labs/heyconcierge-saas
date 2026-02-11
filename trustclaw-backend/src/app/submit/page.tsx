'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Header from '@/components/Header'
import WalletButton from '@/components/wallet-button'
import { 
  Shield, GitBranch, CheckCircle, Loader2, ArrowRight, Wallet, Coins,
  AlertTriangle, XCircle, ArrowLeft
} from 'lucide-react'
import { truncateAddress } from '@/lib/wagmi'
import type { ScanFinding } from '@/types/database'

type Step = 'form' | 'scanning' | 'review' | 'submitted'

export default function SubmitPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [step, setStep] = useState<Step>('form')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    git_url: '',
    wallet_address: '',
    github_username: '',
    category: '',
    tags: '',
  })
  const [scanResult, setScanResult] = useState<{ result: string; findings: ScanFinding[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (address) {
      setFormData(prev => ({ ...prev, wallet_address: address }))
    }
  }, [address])

  const categories = [
    { value: 'automation', label: 'Automation' },
    { value: 'integration', label: 'Integration' },
    { value: 'utility', label: 'Utility' },
    { value: 'data', label: 'Data Processing' },
    { value: 'security', label: 'Security' },
    { value: 'ai', label: 'AI & ML' },
  ]

  const handleScanAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep('scanning')

    try {
      // Step 1: Submit the skill
      const submitRes = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      const submitData = await submitRes.json()
      if (!submitRes.ok) throw new Error(submitData.error || 'Failed to submit skill')

      const submittedId = submitData.skill.id

      // Step 2: Trigger scan
      const scanRes = await fetch(`/api/skills/${submittedId}/scan`, { method: 'POST' })
      const scanData = await scanRes.json()

      if (!scanRes.ok) throw new Error(scanData.error || 'Scan failed')

      setScanResult({
        result: scanData.scan.result,
        findings: scanData.scan.findings || [],
      })
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('form')
    }
  }

  const handleFinalSubmit = () => {
    setStep('submitted')
  }

  // Not connected
  if (!isConnected) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20">
          <div className="card text-center">
            <Wallet className="h-16 w-16 text-trust-green mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-dark-muted mb-8">
              Connect your Base wallet to submit skills. Your wallet address 
              will be used as your publisher identity.
            </p>
            <WalletButton />
            <div className="mt-8 pt-8 border-t border-dark-border">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Coins className="h-5 w-5 text-trust-green" />
                <span className="text-sm font-medium">$TCLAW Staking</span>
                <span className="badge badge-pending text-xs">Coming Soon</span>
              </div>
              <p className="text-dark-muted text-sm">
                Stake $TCLAW tokens to become a verified publisher and earn priority reviews.
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }

  // Scanning in progress
  if (step === 'scanning') {
    return (
      <>
        <Header />
        <main className="max-w-lg mx-auto px-4 py-20">
          <div className="card text-center">
            <Loader2 className="h-16 w-16 animate-spin text-trust-green mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Scanning Your Skill...</h1>
            <p className="text-dark-muted mb-6">
              Our security scanner is analyzing your repository for potential issues.
              This usually takes 10-30 seconds.
            </p>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3 text-dark-muted">
                <CheckCircle className="h-4 w-4 text-trust-green" />
                <span className="text-sm">Skill submitted</span>
              </div>
              <div className="flex items-center gap-3 text-dark-muted">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span className="text-sm">Running security scan...</span>
              </div>
              <div className="flex items-center gap-3 text-dark-muted/50">
                <div className="h-4 w-4 rounded-full border border-dark-border" />
                <span className="text-sm">Review results</span>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  // Scan results review
  if (step === 'review' && scanResult) {
    const isPassing = scanResult.result === 'pass'
    const isWarn = scanResult.result === 'warn'
    const criticalFindings = scanResult.findings.filter(f => f.severity === 'critical' || f.severity === 'high')
    const warningFindings = scanResult.findings.filter(f => f.severity === 'medium')
    const infoFindings = scanResult.findings.filter(f => f.severity === 'low')

    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => { setStep('form'); setScanResult(null) }}
            className="flex items-center gap-2 text-dark-muted hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to form
          </button>

          <div className="card mb-6">
            <div className="flex items-center gap-4 mb-6">
              {isPassing ? (
                <div className="w-14 h-14 bg-trust-green/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-trust-green" />
                </div>
              ) : isWarn ? (
                <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-400" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">Scan Results</h1>
                <p className="text-dark-muted">
                  {isPassing && 'No security issues detected!'}
                  {isWarn && 'Some warnings found — review below.'}
                  {!isPassing && !isWarn && 'Security issues detected.'}
                </p>
              </div>
              <span className={`badge badge-${scanResult.result} ml-auto text-sm`}>
                {scanResult.result.toUpperCase()}
              </span>
            </div>

            {/* Skill summary */}
            <div className="bg-dark-bg rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-dark-muted">Name:</span>{' '}
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div>
                  <span className="text-dark-muted">Version:</span>{' '}
                  <span className="font-medium">{formData.version}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-dark-muted">Repository:</span>{' '}
                  <a href={formData.git_url} target="_blank" rel="noopener noreferrer" className="text-trust-green hover:underline">
                    {formData.git_url}
                  </a>
                </div>
              </div>
            </div>

            {/* Findings */}
            {scanResult.findings.length > 0 ? (
              <div className="space-y-3">
                {criticalFindings.length > 0 && (
                  <div>
                    <h3 className="text-red-400 font-medium text-sm mb-2">Critical / High ({criticalFindings.length})</h3>
                    {criticalFindings.map((f, i) => (
                      <FindingRow key={i} finding={f} />
                    ))}
                  </div>
                )}
                {warningFindings.length > 0 && (
                  <div>
                    <h3 className="text-yellow-400 font-medium text-sm mb-2">Warnings ({warningFindings.length})</h3>
                    {warningFindings.map((f, i) => (
                      <FindingRow key={i} finding={f} />
                    ))}
                  </div>
                )}
                {infoFindings.length > 0 && (
                  <div>
                    <h3 className="text-blue-400 font-medium text-sm mb-2">Info ({infoFindings.length})</h3>
                    {infoFindings.map((f, i) => (
                      <FindingRow key={i} finding={f} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-trust-green py-4">
                <CheckCircle className="h-5 w-5" />
                <span>All security checks passed — no issues found.</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => { setStep('form'); setScanResult(null) }}
              className="flex-1 px-6 py-3 border border-dark-border rounded-lg hover:border-trust-green/50 transition-colors text-center"
            >
              Edit & Rescan
            </button>
            <button
              onClick={handleFinalSubmit}
              className="flex-1 btn-trust py-3 flex items-center justify-center gap-2"
            >
              <Shield className="h-5 w-5" />
              Confirm Submission
            </button>
          </div>
        </main>
      </>
    )
  }

  // Submitted success
  if (step === 'submitted') {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20">
          <div className="card text-center">
            <CheckCircle className="h-16 w-16 text-trust-green mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Skill Submitted!</h1>
            <p className="text-dark-muted mb-8">
              Your skill has been submitted and scanned. An admin will review the scan results 
              before final approval.
            </p>
            <div className="bg-dark-bg rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-4">What happens next?</h3>
              <ol className="text-left space-y-3 text-dark-muted">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-trust-green text-dark-bg flex items-center justify-center text-sm shrink-0 font-bold">✓</span>
                  <span>Automated security scan completed</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-trust-green/20 text-trust-green flex items-center justify-center text-sm shrink-0">2</span>
                  <span>Admin reviews scan results and code quality</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-trust-green/20 text-trust-green flex items-center justify-center text-sm shrink-0">3</span>
                  <span>If approved, your skill becomes publicly available</span>
                </li>
              </ol>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/skills')}
                className="btn-trust inline-flex items-center gap-2"
              >
                Browse Skills
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="px-6 py-2 border border-dark-border rounded-lg hover:border-trust-green/50 transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  // Main form
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Submit Your <span className="text-trust-green">Skill</span>
          </h1>
          <p className="text-dark-muted">
            Share your skill with the community. Your code will be security-scanned
            before you confirm submission.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-trust-green text-dark-bg flex items-center justify-center text-sm font-bold">1</span>
            <span className="text-sm font-medium">Fill Details</span>
          </div>
          <div className="w-8 h-px bg-dark-border" />
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-dark-border text-dark-muted flex items-center justify-center text-sm">2</span>
            <span className="text-sm text-dark-muted">Scan</span>
          </div>
          <div className="w-8 h-px bg-dark-border" />
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-dark-border text-dark-muted flex items-center justify-center text-sm">3</span>
            <span className="text-sm text-dark-muted">Review</span>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleScanAndSubmit} className="space-y-6">
            {/* Skill Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Skill Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="my-awesome-skill"
                required
              />
              <p className="text-dark-muted text-xs mt-1">
                Lowercase, hyphens allowed. This is how users will install your skill.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[100px]"
                placeholder="What does your skill do?"
              />
            </div>

            {/* Version */}
            <div>
              <label className="block text-sm font-medium mb-2">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="input"
                placeholder="1.0.0"
              />
            </div>

            {/* Git URL */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  GitHub Repository URL <span className="text-red-400">*</span>
                </div>
              </label>
              <input
                type="url"
                value={formData.git_url}
                onChange={(e) => setFormData({ ...formData, git_url: e.target.value })}
                className="input"
                placeholder="https://github.com/username/skill-repo"
                required
              />
              <p className="text-dark-muted text-xs mt-1">
                Public GitHub repository. Will be cloned and scanned.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input"
                placeholder="api, webhook, integration"
              />
              <p className="text-dark-muted text-xs mt-1">Comma-separated tags.</p>
            </div>

            <hr className="border-dark-border" />

            {/* Publisher Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Publisher Information</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <div className="flex items-center gap-3 p-3 bg-dark-bg border border-dark-border rounded-lg">
                  <Wallet className="h-5 w-5 text-trust-green" />
                  <span className="font-mono text-sm text-trust-green">
                    {truncateAddress(formData.wallet_address)}
                  </span>
                  <span className="text-dark-muted text-xs">(Connected)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">GitHub Username</label>
                <input
                  type="text"
                  value={formData.github_username}
                  onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                  className="input"
                  placeholder="your-github-username"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-trust w-full py-3 flex items-center justify-center gap-2 text-lg"
            >
              <Shield className="h-5 w-5" />
              Scan & Submit
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="card mt-8 bg-trust-green/5 border-trust-green/20">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-trust-green shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Security First</h3>
              <p className="text-dark-muted text-sm">
                Your skill will be automatically scanned for shell execution, credential access,
                suspicious network requests, and obfuscated code. You&apos;ll see the results
                before confirming your submission.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function FindingRow({ finding }: { finding: ScanFinding }) {
  const colorClass = finding.severity === 'critical' || finding.severity === 'high'
    ? 'bg-red-500/10 border-red-500/20'
    : finding.severity === 'medium'
    ? 'bg-yellow-500/10 border-yellow-500/20'
    : 'bg-blue-500/10 border-blue-500/20'

  return (
    <div className={`p-3 rounded-lg text-sm border mb-2 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium">{finding.category}</span>
        <span className="text-xs opacity-60 uppercase">{finding.severity}</span>
      </div>
      <p className="text-dark-muted">{finding.message}</p>
      {finding.file && (
        <p className="text-xs text-dark-muted mt-1 font-mono">
          {finding.file}{finding.line ? `:${finding.line}` : ''}
        </p>
      )}
    </div>
  )
}
