'use client'

import { useState } from 'react'
import { Shield, ShieldAlert, ShieldCheck, ShieldX, ChevronDown, ChevronRight, FileCode, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Finding {
  type: string
  category: string
  message: string
  file?: string
  line?: number
  severity: 'critical' | 'high' | 'medium' | 'low'
}

interface ScanResponse {
  passed: boolean
  result: 'pass' | 'warn' | 'fail'
  score: number
  summary: {
    filesScanned: number
    critical: number
    high: number
    medium: number
    low: number
  }
  findings: {
    critical: Finding[]
    warnings: Finding[]
    info: Finding[]
  }
  totalFindings: number
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, result }: { score: number; result: string }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = result === 'pass' ? '#22c55e' : result === 'warn' ? '#eab308' : '#ef4444'

  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
          {result === 'pass' ? 'Safe' : result === 'warn' ? 'Caution' : 'Unsafe'}
        </span>
      </div>
    </div>
  )
}

// ─── Finding Row ─────────────────────────────────────────────────────────────

function FindingRow({ finding }: { finding: Finding }) {
  const icons = {
    critical: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
    high: <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />,
    medium: <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />,
    low: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  }
  const badges = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
      {icons[finding.severity]}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 leading-snug">{finding.message}</p>
        <div className="flex items-center gap-2 mt-1">
          {finding.file && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <FileCode className="w-3 h-3" />
              {finding.file}{finding.line ? `:${finding.line}` : ''}
            </span>
          )}
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badges[finding.severity]}`}>
            {finding.severity.toUpperCase()}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">{finding.category}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Collapsible Section ─────────────────────────────────────────────────────

function FindingSection({ title, findings, defaultOpen = false, icon }: {
  title: string; findings: Finding[]; defaultOpen?: boolean; icon: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (findings.length === 0) return null

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
        {icon}
        <span className="text-sm font-medium text-zinc-300">{title}</span>
        <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{findings.length}</span>
      </button>
      {open && (
        <div className="divide-y divide-zinc-800/50 px-1 pb-1">
          {findings.map((f, i) => <FindingRow key={i} finding={f} />)}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ScanResults({ initialData }: { initialData?: ScanResponse }) {
  const [url, setUrl] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'url' | 'code'>('url')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ScanResponse | null>(initialData || null)
  const [error, setError] = useState<string | null>(null)

  const runScan = async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const body = mode === 'url' ? { url } : { code, filename: 'uploaded.js' }
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Scan failed')
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const StatusIcon = data?.result === 'pass' ? ShieldCheck : data?.result === 'warn' ? ShieldAlert : data ? ShieldX : Shield

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Input Form ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-emerald-500" />
          <h2 className="text-lg font-semibold text-zinc-100">TrustClaw Security Scanner</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('url')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'url' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            GitHub URL
          </button>
          <button
            onClick={() => setMode('code')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'code' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Paste Code
          </button>
        </div>

        {mode === 'url' ? (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 transition-colors"
          />
        ) : (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste skill code here..."
            rows={8}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 transition-colors font-mono resize-y"
          />
        )}

        <button
          onClick={runScan}
          disabled={loading || (mode === 'url' ? !url : !code)}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Run Security Scan
            </>
          )}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {data && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-6">
            <ScoreRing score={data.score} result={data.result} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${
                  data.result === 'pass' ? 'text-green-500' : data.result === 'warn' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <span className="text-lg font-semibold text-zinc-100">
                  {data.result === 'pass' ? 'No Issues Found' : data.result === 'warn' ? 'Caution Advised' : 'Security Issues Detected'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Critical', count: data.summary.critical, color: 'text-red-400 bg-red-500/10' },
                  { label: 'High', count: data.summary.high, color: 'text-orange-400 bg-orange-500/10' },
                  { label: 'Medium', count: data.summary.medium, color: 'text-yellow-400 bg-yellow-500/10' },
                  { label: 'Low', count: data.summary.low, color: 'text-blue-400 bg-blue-500/10' },
                ].map(s => (
                  <div key={s.label} className={`text-center py-2 rounded-lg ${s.color}`}>
                    <div className="text-lg font-bold">{s.count}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-70">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500">{data.summary.filesScanned} files scanned · {data.totalFindings} total findings</p>
            </div>
          </div>

          {/* Finding Sections */}
          <div className="space-y-3">
            <FindingSection
              title="Critical Issues"
              findings={data.findings.critical}
              defaultOpen={true}
              icon={<XCircle className="w-4 h-4 text-red-500" />}
            />
            <FindingSection
              title="Warnings"
              findings={data.findings.warnings}
              defaultOpen={data.findings.critical.length === 0}
              icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}
            />
            <FindingSection
              title="Info"
              findings={data.findings.info}
              icon={<Info className="w-4 h-4 text-blue-400" />}
            />
          </div>
        </div>
      )}
    </div>
  )
}
