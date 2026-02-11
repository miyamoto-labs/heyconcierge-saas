export interface Position { x: number; y: number }

export interface NodeData {
  id: string
  type: string
  category: string
  label: string
  icon: string
  position: Position
  config: Record<string, any>
}

export interface EdgeData {
  id: string
  source: string
  target: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  template_id: string | null
  config: Record<string, any>
  nodes: NodeData[]
  edges: EdgeData[]
  status: 'draft' | 'published' | 'deployed'
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  icon: string
  config: Record<string, any>
  nodes: NodeData[]
  edges: EdgeData[]
  is_premium: boolean
  uses: number
}

export type ComponentCategory = 'triggers' | 'actions' | 'conditions' | 'integrations' | 'ai'

export interface ComponentDef {
  type: string
  label: string
  icon: string
  category: ComponentCategory
  color: string
  configFields: ConfigField[]
}

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'toggle'
  options?: string[]
  placeholder?: string
  default?: any
}

// All available component definitions
export const COMPONENTS: ComponentDef[] = [
  // Triggers
  { type: 'schedule', label: 'Schedule', icon: '⏱', category: 'triggers', color: '#8b5cf6', configFields: [
    { key: 'cron', label: 'Cron Expression', type: 'text', placeholder: '0 */4 * * *' },
    { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'UTC', default: 'UTC' },
  ]},
  { type: 'webhook', label: 'Webhook', icon: '🔗', category: 'triggers', color: '#8b5cf6', configFields: [
    { key: 'path', label: 'Endpoint Path', type: 'text', placeholder: '/webhook/my-agent' },
    { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT'] },
  ]},
  { type: 'event', label: 'Event', icon: '⚡', category: 'triggers', color: '#8b5cf6', configFields: [
    { key: 'event_name', label: 'Event Name', type: 'text', placeholder: 'user.signup' },
    { key: 'source', label: 'Source', type: 'select', options: ['Internal', 'Webhook', 'Queue'] },
  ]},
  { type: 'manual', label: 'Manual', icon: '▶️', category: 'triggers', color: '#8b5cf6', configFields: [
    { key: 'description', label: 'Description', type: 'text', placeholder: 'Manually triggered' },
  ]},
  // Actions
  { type: 'send_message', label: 'Send Message', icon: '📤', category: 'actions', color: '#3b82f6', configFields: [
    { key: 'channel', label: 'Channel', type: 'select', options: ['Slack', 'Discord', 'Telegram', 'Email', 'SMS'] },
    { key: 'recipient', label: 'Recipient', type: 'text', placeholder: '#general or user@email.com' },
    { key: 'message', label: 'Message Template', type: 'textarea', placeholder: 'Hello {{name}}!' },
  ]},
  { type: 'call_api', label: 'Call API', icon: '🔄', category: 'actions', color: '#3b82f6', configFields: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/data' },
    { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
    { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer ..."}' },
    { key: 'body', label: 'Body (JSON)', type: 'textarea', placeholder: '{}' },
  ]},
  { type: 'run_script', label: 'Run Script', icon: '📜', category: 'actions', color: '#3b82f6', configFields: [
    { key: 'language', label: 'Language', type: 'select', options: ['JavaScript', 'Python'] },
    { key: 'code', label: 'Code', type: 'textarea', placeholder: '// your code here' },
  ]},
  { type: 'generate_text', label: 'Generate Text', icon: '✍️', category: 'actions', color: '#3b82f6', configFields: [
    { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Write a summary of...' },
    { key: 'model', label: 'Model', type: 'select', options: ['GPT-4', 'Claude', 'DeepSeek', 'Llama'] },
    { key: 'temperature', label: 'Temperature', type: 'number', default: 0.7 },
  ]},
  // Conditions
  { type: 'if_else', label: 'If / Else', icon: '🔀', category: 'conditions', color: '#f59e0b', configFields: [
    { key: 'condition', label: 'Condition', type: 'text', placeholder: '{{price}} > 50000' },
  ]},
  { type: 'filter', label: 'Filter', icon: '🔢', category: 'conditions', color: '#f59e0b', configFields: [
    { key: 'field', label: 'Field', type: 'text', placeholder: 'data.items' },
    { key: 'condition', label: 'Filter Condition', type: 'text', placeholder: 'item.value > 100' },
  ]},
  { type: 'switch', label: 'Switch', icon: '🔃', category: 'conditions', color: '#f59e0b', configFields: [
    { key: 'variable', label: 'Variable', type: 'text', placeholder: '{{status}}' },
    { key: 'cases', label: 'Cases (comma-separated)', type: 'text', placeholder: 'active, inactive, pending' },
  ]},
  // Integrations
  { type: 'twitter', label: 'Twitter/X', icon: '🐦', category: 'integrations', color: '#10b981', configFields: [
    { key: 'action', label: 'Action', type: 'select', options: ['Post Tweet', 'Search', 'Like', 'Reply', 'Follow'] },
    { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Tweet text or search query' },
  ]},
  { type: 'telegram', label: 'Telegram', icon: '💬', category: 'integrations', color: '#10b981', configFields: [
    { key: 'action', label: 'Action', type: 'select', options: ['Send Message', 'Read Messages', 'Send Photo'] },
    { key: 'chat_id', label: 'Chat ID', type: 'text', placeholder: '-100123456789' },
    { key: 'message', label: 'Message', type: 'textarea' },
  ]},
  { type: 'email', label: 'Email', icon: '📧', category: 'integrations', color: '#10b981', configFields: [
    { key: 'action', label: 'Action', type: 'select', options: ['Send', 'Read Inbox', 'Search'] },
    { key: 'to', label: 'To', type: 'text', placeholder: 'user@example.com' },
    { key: 'subject', label: 'Subject', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
  ]},
  { type: 'slack', label: 'Slack', icon: '💼', category: 'integrations', color: '#10b981', configFields: [
    { key: 'action', label: 'Action', type: 'select', options: ['Send Message', 'Read Channel', 'React'] },
    { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general' },
    { key: 'message', label: 'Message', type: 'textarea' },
  ]},
  { type: 'openclaw', label: 'OpenClaw', icon: '🦞', category: 'integrations', color: '#10b981', configFields: [
    { key: 'action', label: 'Action', type: 'select', options: ['Run Skill', 'Browse Website', 'Capture API'] },
    { key: 'skill', label: 'Skill Name', type: 'text' },
    { key: 'params', label: 'Parameters (JSON)', type: 'textarea', placeholder: '{}' },
  ]},
  // AI
  { type: 'llm_call', label: 'LLM Call', icon: '🧠', category: 'ai', color: '#ec4899', configFields: [
    { key: 'model', label: 'Model', type: 'select', options: ['GPT-4o', 'Claude Sonnet', 'DeepSeek', 'Llama 3'] },
    { key: 'system_prompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant...' },
    { key: 'user_prompt', label: 'User Prompt', type: 'textarea', placeholder: '{{input}}' },
    { key: 'temperature', label: 'Temperature', type: 'number', default: 0.7 },
    { key: 'max_tokens', label: 'Max Tokens', type: 'number', default: 1000 },
  ]},
  { type: 'summarize', label: 'Summarize', icon: '📋', category: 'ai', color: '#ec4899', configFields: [
    { key: 'input', label: 'Input Field', type: 'text', placeholder: '{{data}}' },
    { key: 'style', label: 'Style', type: 'select', options: ['Brief', 'Detailed', 'Bullet Points', 'Executive'] },
    { key: 'max_length', label: 'Max Length (words)', type: 'number', default: 200 },
  ]},
  { type: 'classify', label: 'Classify', icon: '🏷️', category: 'ai', color: '#ec4899', configFields: [
    { key: 'input', label: 'Input', type: 'text', placeholder: '{{text}}' },
    { key: 'categories', label: 'Categories (comma-separated)', type: 'text', placeholder: 'positive, negative, neutral' },
  ]},
  { type: 'extract', label: 'Extract', icon: '🔍', category: 'ai', color: '#ec4899', configFields: [
    { key: 'input', label: 'Input', type: 'text', placeholder: '{{text}}' },
    { key: 'fields', label: 'Fields to Extract', type: 'text', placeholder: 'name, email, phone' },
    { key: 'format', label: 'Output Format', type: 'select', options: ['JSON', 'CSV', 'Text'] },
  ]},
]

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  triggers: 'Triggers',
  actions: 'Actions',
  conditions: 'Conditions',
  integrations: 'Integrations',
  ai: 'AI',
}
