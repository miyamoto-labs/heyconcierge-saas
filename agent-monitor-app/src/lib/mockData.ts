export type AgentStatus = 'healthy' | 'warning' | 'critical' | 'offline'

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  uptime: number
  lastHeartbeat: string
  errorCount: number
  avgLatency: number
  tokensToday: number
  framework: string
}

export const agents: Agent[] = [
  { id: '1', name: 'customer-support-v3', status: 'healthy', uptime: 99.98, lastHeartbeat: '2s ago', errorCount: 0, avgLatency: 340, tokensToday: 45200, framework: 'LangChain' },
  { id: '2', name: 'code-review-bot', status: 'healthy', uptime: 99.95, lastHeartbeat: '5s ago', errorCount: 2, avgLatency: 890, tokensToday: 128400, framework: 'OpenAI' },
  { id: '3', name: 'data-pipeline-agent', status: 'warning', uptime: 98.2, lastHeartbeat: '45s ago', errorCount: 12, avgLatency: 1240, tokensToday: 89300, framework: 'CrewAI' },
  { id: '4', name: 'slack-assistant', status: 'healthy', uptime: 99.99, lastHeartbeat: '1s ago', errorCount: 0, avgLatency: 210, tokensToday: 23100, framework: 'OpenClaw' },
  { id: '5', name: 'email-triage', status: 'critical', uptime: 87.3, lastHeartbeat: '5m ago', errorCount: 47, avgLatency: 2100, tokensToday: 5200, framework: 'AutoGen' },
  { id: '6', name: 'inventory-optimizer', status: 'healthy', uptime: 99.91, lastHeartbeat: '3s ago', errorCount: 1, avgLatency: 560, tokensToday: 67800, framework: 'LangGraph' },
  { id: '7', name: 'content-writer', status: 'healthy', uptime: 99.87, lastHeartbeat: '8s ago', errorCount: 3, avgLatency: 1450, tokensToday: 201000, framework: 'Anthropic' },
  { id: '8', name: 'fraud-detector', status: 'warning', uptime: 97.5, lastHeartbeat: '32s ago', errorCount: 8, avgLatency: 780, tokensToday: 34500, framework: 'Custom' },
  { id: '9', name: 'onboarding-flow', status: 'healthy', uptime: 99.94, lastHeartbeat: '4s ago', errorCount: 1, avgLatency: 420, tokensToday: 56700, framework: 'LangChain' },
  { id: '10', name: 'report-generator', status: 'offline', uptime: 0, lastHeartbeat: '2h ago', errorCount: 0, avgLatency: 0, tokensToday: 0, framework: 'CrewAI' },
]

export const errorRateData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  errors: Math.floor(Math.random() * 8) + (i >= 14 && i <= 16 ? 15 : 0),
  warnings: Math.floor(Math.random() * 5) + (i >= 14 && i <= 16 ? 8 : 0),
}))

export const latencyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  p50: 200 + Math.floor(Math.random() * 100),
  p95: 600 + Math.floor(Math.random() * 300),
  p99: 1200 + Math.floor(Math.random() * 800),
}))

export const tokenData = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return {
    day: d.toLocaleDateString('en', { weekday: 'short' }),
    tokens: 400000 + Math.floor(Math.random() * 200000),
    cost: +(2.5 + Math.random() * 2).toFixed(2),
  }
})

export interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  agent: string
  time: string
}

export const alerts: Alert[] = [
  { id: '1', severity: 'critical', message: 'Agent unresponsive for 5 minutes', agent: 'email-triage', time: '2 min ago' },
  { id: '2', severity: 'warning', message: 'Error rate exceeded 5% threshold', agent: 'fraud-detector', time: '8 min ago' },
  { id: '3', severity: 'warning', message: 'Latency spike detected (>2s p95)', agent: 'data-pipeline-agent', time: '15 min ago' },
  { id: '4', severity: 'info', message: 'Agent restarted successfully', agent: 'report-generator', time: '1 hour ago' },
  { id: '5', severity: 'critical', message: 'Token budget 90% consumed', agent: 'content-writer', time: '1 hour ago' },
  { id: '6', severity: 'info', message: 'New agent registered', agent: 'onboarding-flow', time: '3 hours ago' },
]
