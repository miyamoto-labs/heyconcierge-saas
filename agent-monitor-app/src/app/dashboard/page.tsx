'use client'
import { agents, alerts, errorRateData, latencyData, tokenData } from '@/lib/mockData'
import type { AgentStatus } from '@/lib/mockData'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const statusColor: Record<AgentStatus, string> = {
  healthy: 'bg-healthy',
  warning: 'bg-warning',
  critical: 'bg-critical',
  offline: 'bg-zinc-600',
}

const statusBg: Record<AgentStatus, string> = {
  healthy: 'bg-healthy/10 text-healthy',
  warning: 'bg-warning/10 text-warning',
  critical: 'bg-critical/10 text-critical',
  offline: 'bg-zinc-800 text-zinc-400',
}

const sevColor = { critical: 'text-critical', warning: 'text-warning', info: 'text-zinc-400' }
const sevBg = { critical: 'bg-critical/10', warning: 'bg-warning/10', info: 'bg-white/5' }

const healthyCount = agents.filter(a => a.status === 'healthy').length
const warningCount = agents.filter(a => a.status === 'warning').length
const criticalCount = agents.filter(a => a.status === 'critical' || a.status === 'offline').length
const totalTokens = agents.reduce((s, a) => s + a.tokensToday, 0)

export default function Dashboard() {
  return (
    <main className="pt-20 pb-12 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Fleet</h1>
          <p className="text-zinc-500 text-sm mt-1">Monitoring {agents.length} agents across 6 frameworks</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-healthy" />{healthyCount} Healthy</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning" />{warningCount} Warning</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-critical" />{criticalCount} Critical</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Agents', value: agents.length, sub: `${healthyCount} healthy` },
          { label: 'Fleet Uptime', value: '98.4%', sub: 'Last 24h' },
          { label: 'Tokens Today', value: `${(totalTokens / 1000).toFixed(0)}K`, sub: `$${(totalTokens * 0.000004).toFixed(2)} est.` },
          { label: 'Active Alerts', value: alerts.filter(a => a.severity === 'critical').length, sub: 'Critical' },
        ].map(c => (
          <div key={c.label} className="p-5 rounded-xl bg-surface-2 border border-border">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{c.label}</div>
            <div className="text-2xl font-bold text-white font-mono">{c.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {agents.map(a => (
          <div key={a.id} className="p-4 rounded-xl bg-surface-2 border border-border card-hover cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBg[a.status]}`}>
                {a.status}
              </span>
              <span className={`w-2 h-2 rounded-full ${statusColor[a.status]} ${a.status === 'healthy' ? 'pulse-dot' : ''}`} />
            </div>
            <div className="text-sm font-semibold text-white truncate mb-1">{a.name}</div>
            <div className="text-xs text-zinc-500 mb-3">{a.framework}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-zinc-500">Uptime</div>
                <div className="font-mono text-white">{a.uptime}%</div>
              </div>
              <div>
                <div className="text-zinc-500">Errors</div>
                <div className={`font-mono ${a.errorCount > 10 ? 'text-critical' : a.errorCount > 0 ? 'text-warning' : 'text-white'}`}>{a.errorCount}</div>
              </div>
              <div>
                <div className="text-zinc-500">Latency</div>
                <div className="font-mono text-white">{a.avgLatency}ms</div>
              </div>
              <div>
                <div className="text-zinc-500">Heartbeat</div>
                <div className="font-mono text-white">{a.lastHeartbeat}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <h3 className="text-sm font-semibold text-white mb-4">Error Rate (24h)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={errorRateData}>
              <defs>
                <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="warnings" stroke="#eab308" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <h3 className="text-sm font-semibold text-white mb-4">Response Latency (24h)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} width={40} unit="ms" />
              <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="p50" stroke="#22c55e" fill="url(#latGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="p95" stroke="#eab308" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="p99" stroke="#ef4444" fill="none" strokeWidth={1} strokeDasharray="2 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <h3 className="text-sm font-semibold text-white mb-4">Token Usage (7d)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tokenData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="tokens" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="rounded-xl bg-surface-2 border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
          <span className="text-xs text-zinc-500">{alerts.length} alerts</span>
        </div>
        <div className="divide-y divide-border">
          {alerts.map(a => (
            <div key={a.id} className="px-5 py-3 flex items-center gap-4">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${sevBg[a.severity]} ${sevColor[a.severity]}`}>
                {a.severity}
              </span>
              <span className="text-sm text-white flex-1">{a.message}</span>
              <span className="text-xs text-zinc-500 font-mono">{a.agent}</span>
              <span className="text-xs text-zinc-600">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
