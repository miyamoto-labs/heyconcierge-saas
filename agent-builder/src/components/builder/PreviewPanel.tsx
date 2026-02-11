'use client'
import { useState } from 'react'
import { NodeData, EdgeData, COMPONENTS } from '@/lib/types'
import { Play, X, ChevronRight, Sparkles } from 'lucide-react'

interface Props {
  nodes: NodeData[]
  edges: EdgeData[]
  onClose: () => void
}

interface StepResult {
  nodeId: string
  label: string
  icon: string
  type: string
  status: 'pending' | 'running' | 'done' | 'error'
  input: string
  output: string
  duration?: number
}

const MOCK_OUTPUTS: Record<string, (node: NodeData, input: string) => string> = {
  schedule: (n) => JSON.stringify({ triggered: true, time: new Date().toISOString(), cron: n.config.cron || '* * * * *' }, null, 2),
  webhook: (n) => JSON.stringify({ method: n.config.method || 'POST', path: n.config.path || '/webhook', body: { message: 'Hello from webhook' } }, null, 2),
  event: (n) => JSON.stringify({ event: n.config.event_name || 'user.signup', data: { user_id: 'usr_abc123' } }, null, 2),
  manual: () => JSON.stringify({ triggered: true, source: 'manual' }, null, 2),
  call_api: (n) => JSON.stringify({ status: 200, data: { price: 67432.50, currency: 'USD', source: n.config.url || 'api.example.com' } }, null, 2),
  llm_call: (n, input) => JSON.stringify({ model: n.config.model || 'GPT-4o', tokens: 247, response: `Based on the input "${input.slice(0, 50)}...", here is my analysis: The data shows positive trends with key indicators improving.` }, null, 2),
  send_message: (n) => JSON.stringify({ sent: true, channel: n.config.channel || 'Slack', recipient: n.config.recipient || '#general', messageId: 'msg_' + Math.random().toString(36).slice(2, 8) }, null, 2),
  if_else: (n) => JSON.stringify({ condition: n.config.condition || 'value > threshold', result: true, branch: 'true' }, null, 2),
  filter: (n) => JSON.stringify({ input_count: 12, output_count: 5, field: n.config.field || 'data.items' }, null, 2),
  switch: (n) => JSON.stringify({ variable: n.config.variable || 'status', matched: n.config.cases?.split(',')[0]?.trim() || 'active' }, null, 2),
  summarize: (n) => JSON.stringify({ summary: 'Key findings: Revenue increased 23% QoQ. User engagement up 15%. Three action items identified.', words: n.config.max_length || 200, style: n.config.style || 'Brief' }, null, 2),
  classify: (n) => JSON.stringify({ label: n.config.categories?.split(',')[0]?.trim() || 'positive', confidence: 0.94, categories: (n.config.categories || 'positive,negative,neutral').split(',').map((c: string) => c.trim()) }, null, 2),
  extract: (n) => JSON.stringify({ fields: Object.fromEntries((n.config.fields || 'name,email').split(',').map((f: string) => [f.trim(), f.trim() === 'email' ? 'john@example.com' : f.trim() === 'name' ? 'John Doe' : 'extracted_value'])) }, null, 2),
  twitter: (n) => JSON.stringify({ action: n.config.action || 'Post Tweet', success: true, tweet_id: '1234567890', engagement: { likes: 0, retweets: 0 } }, null, 2),
  telegram: (n) => JSON.stringify({ action: n.config.action || 'Send Message', delivered: true, chat_id: n.config.chat_id || '-100123456' }, null, 2),
  email: (n) => JSON.stringify({ sent: true, to: n.config.to || 'user@example.com', subject: n.config.subject || 'Agent Notification' }, null, 2),
  slack: (n) => JSON.stringify({ sent: true, channel: n.config.channel || '#general', ts: '1234567890.123456' }, null, 2),
  openclaw: (n) => JSON.stringify({ skill: n.config.skill || 'default', executed: true, result: { status: 'ok' } }, null, 2),
  run_script: (n) => JSON.stringify({ language: n.config.language || 'Python', exitCode: 0, stdout: 'Script executed successfully', duration_ms: Math.floor(Math.random() * 500) }, null, 2),
  generate_text: (n) => JSON.stringify({ model: n.config.model || 'GPT-4', text: 'Generated content based on the provided prompt. This is a creative response tailored to your specifications.', tokens: 156 }, null, 2),
}

function topoSort(nodes: NodeData[], edges: EdgeData[]): NodeData[] {
  const inDeg = new Map(nodes.map(n => [n.id, 0]))
  for (const e of edges) inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1)
  const queue = nodes.filter(n => (inDeg.get(n.id) || 0) === 0)
  const result: NodeData[] = []
  const visited = new Set<string>()
  while (queue.length) {
    const n = queue.shift()!
    if (visited.has(n.id)) continue
    visited.add(n.id)
    result.push(n)
    for (const e of edges.filter(e => e.source === n.id)) {
      const d = (inDeg.get(e.target) || 1) - 1
      inDeg.set(e.target, d)
      if (d === 0) { const t = nodes.find(x => x.id === e.target); if (t) queue.push(t) }
    }
  }
  for (const n of nodes) if (!visited.has(n.id)) result.push(n)
  return result
}

export function PreviewPanel({ nodes, edges, onClose }: Props) {
  const [steps, setSteps] = useState<StepResult[]>([])
  const [running, setRunning] = useState(false)
  const [sampleInput, setSampleInput] = useState('{"query": "What is the current BTC price?", "user": "demo_user"}')
  const [done, setDone] = useState(false)

  const runPreview = async () => {
    setRunning(true)
    setDone(false)
    const sorted = topoSort(nodes, edges)
    const initial: StepResult[] = sorted.map(n => ({
      nodeId: n.id, label: n.label, icon: n.icon, type: n.type,
      status: 'pending', input: '', output: ''
    }))
    setSteps(initial)

    let lastOutput = sampleInput
    for (let i = 0; i < sorted.length; i++) {
      const node = sorted[i]
      setSteps(prev => prev.map((s, j) => j === i ? { ...s, status: 'running', input: lastOutput.slice(0, 200) } : s))
      const start = Date.now()
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600))
      const mockFn = MOCK_OUTPUTS[node.type] || (() => JSON.stringify({ status: 'ok', type: node.type }, null, 2))
      const output = mockFn(node, lastOutput)
      lastOutput = output
      setSteps(prev => prev.map((s, j) => j === i ? { ...s, status: 'done', output, duration: Date.now() - start } : s))
    }
    setRunning(false)
    setDone(true)
  }

  return (
    <div className="w-96 border-l border-white/10 bg-gray-900/95 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Agent Preview</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X className="w-4 h-4" /></button>
      </div>

      {/* Sample Input */}
      <div className="px-4 py-3 border-b border-white/10">
        <label className="text-xs text-gray-500 mb-1.5 block">Sample Input</label>
        <textarea
          value={sampleInput}
          onChange={e => setSampleInput(e.target.value)}
          className="w-full bg-gray-800 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-gray-300 resize-none focus:outline-none focus:border-purple-500 transition"
          rows={3}
        />
        <button
          onClick={runPreview}
          disabled={running || nodes.length === 0}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40"
          style={{ background: running ? '#374151' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
        >
          {running ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Simulating...</>
          ) : (
            <><Play className="w-3.5 h-3.5" /> Run Preview</>
          )}
        </button>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {steps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-50">🧪</div>
            <p className="text-gray-500 text-sm">Click "Run Preview" to simulate<br/>your agent's execution</p>
            <p className="text-gray-600 text-xs mt-2">Each node processes the sample input<br/>and passes output to the next</p>
          </div>
        )}
        {steps.map((step, i) => (
          <div key={step.nodeId} className={`rounded-xl border transition-all duration-300 overflow-hidden ${
            step.status === 'running' ? 'border-purple-500/50 bg-purple-500/5' :
            step.status === 'done' ? 'border-emerald-500/30 bg-emerald-500/5' :
            'border-white/5 bg-gray-800/50'
          }`}>
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="text-base">{step.icon}</span>
              <span className="text-xs font-medium text-white flex-1">{step.label}</span>
              {step.status === 'running' && <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />}
              {step.status === 'done' && <span className="text-emerald-400 text-xs">✓ {step.duration}ms</span>}
              {step.status === 'pending' && <span className="text-gray-600 text-xs">pending</span>}
            </div>
            {step.status === 'done' && (
              <div className="px-3 pb-2">
                <div className="bg-gray-900/80 rounded-lg p-2 text-[10px] font-mono text-gray-400 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {step.output}
                </div>
              </div>
            )}
          </div>
        ))}
        {done && (
          <div className="text-center py-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 text-xs font-medium">✅ All {steps.length} steps completed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
