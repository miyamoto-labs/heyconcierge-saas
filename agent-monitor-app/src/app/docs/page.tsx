'use client'
import { useState } from 'react'

const tabs = ['Python', 'JavaScript', 'OpenClaw'] as const

const snippets: Record<typeof tabs[number], string> = {
  Python: `# Install
pip install agent-monitor

# Initialize
from agent_monitor import Monitor

monitor = Monitor(api_key="aw_live_your_key_here")

# Track events
monitor.track("my-agent", event="task_complete", metadata={
    "tokens": 150,
    "latency_ms": 340,
    "model": "gpt-4"
})

# Heartbeat (call periodically)
monitor.heartbeat("my-agent")

# Error tracking
try:
    result = agent.run(task)
    monitor.track("my-agent", event="success", metadata={"result": result})
except Exception as e:
    monitor.track("my-agent", event="error", metadata={"error": str(e)})`,

  JavaScript: `// Install
npm install @agentwatch/sdk

// Initialize
import { Monitor } from '@agentwatch/sdk';

const monitor = new Monitor({ apiKey: 'aw_live_your_key_here' });

// Track events
await monitor.track('my-agent', {
  event: 'task_complete',
  metadata: { tokens: 150, latency_ms: 340 }
});

// Heartbeat
await monitor.heartbeat('my-agent');

// Wrap your agent with auto-monitoring
const tracked = monitor.wrap('my-agent', myAgentFunction);
const result = await tracked(input); // auto-tracks success/failure`,

  OpenClaw: `# In your OpenClaw agent config, add:
monitoring:
  provider: agentwatch
  api_key: aw_live_your_key_here
  track_events: true
  heartbeat_interval: 30s
  alert_on_error: true

# That's it — OpenClaw auto-instruments:
# ✓ Heartbeats
# ✓ Task completion/failure
# ✓ Token usage
# ✓ Latency tracking
# ✓ Error context & traces`,
}

const webhookSnippet = `{
  "url": "https://your-server.com/webhooks/agentwatch",
  "events": ["agent.down", "agent.error", "agent.budget_exceeded"],
  "secret": "whsec_your_signing_secret",
  "headers": {
    "X-Custom-Header": "value"
  }
}`

const alertRulesSnippet = `rules:
  - name: "Agent Down"
    condition: heartbeat_missing > 60s
    severity: critical
    notify: [slack, email]

  - name: "High Error Rate"
    condition: error_rate > 5%
    window: 5m
    severity: warning
    notify: [slack]

  - name: "Budget Alert"
    condition: daily_tokens > 500000
    severity: warning
    notify: [email]`

export default function Docs() {
  const [tab, setTab] = useState<typeof tabs[number]>('Python')

  return (
    <main className="pt-20 pb-16 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Integration Guide</h1>
      <p className="text-zinc-400 mb-10">Get up and running in under 2 minutes.</p>

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-healthy/20 text-healthy flex items-center justify-center text-sm font-bold">1</span>
          Quick Start
        </h2>
        <div className="flex gap-1 mb-4">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-healthy/10 text-healthy' : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-surface-2 border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-3 border-b border-border">
            <div className="w-2.5 h-2.5 rounded-full bg-critical/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-healthy/60" />
            <span className="ml-2 text-xs text-zinc-500 font-mono">{tab.toLowerCase()}</span>
          </div>
          <pre className="p-5 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">
            {snippets[tab]}
          </pre>
        </div>
      </section>

      {/* Webhook Config */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-healthy/20 text-healthy flex items-center justify-center text-sm font-bold">2</span>
          Webhook Configuration
        </h2>
        <p className="text-zinc-400 text-sm mb-4">
          Receive real-time event notifications via webhooks. Configure in your dashboard or via API:
        </p>
        <div className="rounded-xl bg-surface-2 border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-3 border-b border-border">
            <span className="text-xs text-zinc-500 font-mono">POST /api/v1/webhooks</span>
          </div>
          <pre className="p-5 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">
            {webhookSnippet}
          </pre>
        </div>
        <div className="mt-4 p-4 rounded-xl bg-surface-3 border border-border text-sm">
          <div className="font-medium text-white mb-2">Available Events</div>
          <div className="grid grid-cols-2 gap-2 text-zinc-400 font-mono text-xs">
            <span>agent.up</span><span>agent.down</span>
            <span>agent.error</span><span>agent.recovered</span>
            <span>agent.budget_exceeded</span><span>agent.latency_spike</span>
          </div>
        </div>
      </section>

      {/* Alert Rules */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-healthy/20 text-healthy flex items-center justify-center text-sm font-bold">3</span>
          Alert Rules
        </h2>
        <p className="text-zinc-400 text-sm mb-4">
          Define custom alert rules using simple YAML syntax or the dashboard UI:
        </p>
        <div className="rounded-xl bg-surface-2 border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-3 border-b border-border">
            <span className="text-xs text-zinc-500 font-mono">agentwatch.yaml</span>
          </div>
          <pre className="p-5 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">
            {alertRulesSnippet}
          </pre>
        </div>
      </section>

      {/* API Reference */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-healthy/20 text-healthy flex items-center justify-center text-sm font-bold">4</span>
          API Reference
        </h2>
        <div className="space-y-3">
          {[
            { method: 'POST', path: '/api/v1/track', desc: 'Send an event for an agent' },
            { method: 'POST', path: '/api/v1/heartbeat', desc: 'Send agent heartbeat' },
            { method: 'GET', path: '/api/v1/agents', desc: 'List all agents' },
            { method: 'GET', path: '/api/v1/agents/:id/metrics', desc: 'Get agent metrics' },
            { method: 'GET', path: '/api/v1/alerts', desc: 'List recent alerts' },
            { method: 'POST', path: '/api/v1/webhooks', desc: 'Create webhook endpoint' },
          ].map(e => (
            <div key={e.path} className="flex items-center gap-4 p-3 rounded-lg bg-surface-2 border border-border">
              <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                e.method === 'POST' ? 'bg-healthy/10 text-healthy' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {e.method}
              </span>
              <span className="font-mono text-sm text-white">{e.path}</span>
              <span className="text-sm text-zinc-500 ml-auto">{e.desc}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
