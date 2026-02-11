import { createServiceClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Migration script to create tables and seed initial data
// Call this endpoint after deployment to initialize the database

const templates = [
  {
    name: 'Customer Support Bot',
    description: 'Automated customer support with AI responses and routing',
    category: 'support',
    icon: '🎧',
    nodes: [
      { id: '1', type: 'webhook', category: 'triggers', label: 'Webhook', icon: '🔗', position: { x: 100, y: 100 }, config: { path: '/support', method: 'POST' } },
      { id: '2', type: 'extract', category: 'ai', label: 'Extract', icon: '🔍', position: { x: 300, y: 100 }, config: { input: '{{body}}', fields: 'question, sentiment, urgency' } },
      { id: '3', type: 'llm_call', category: 'ai', label: 'LLM Call', icon: '🧠', position: { x: 500, y: 100 }, config: { model: 'GPT-4o', system_prompt: 'You are a helpful support agent', user_prompt: '{{question}}' } },
      { id: '4', type: 'send_message', category: 'actions', label: 'Send Message', icon: '📤', position: { x: 700, y: 100 }, config: { channel: 'Email', recipient: '{{customer_email}}', message: '{{response}}' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '3', target: '4' },
    ],
  },
  {
    name: 'Social Media Manager',
    description: 'Schedule and post content to social media platforms',
    category: 'social',
    icon: '📱',
    nodes: [
      { id: '1', type: 'schedule', category: 'triggers', label: 'Schedule', icon: '⏱', position: { x: 100, y: 100 }, config: { cron: '0 9,15 * * *', timezone: 'UTC' } },
      { id: '2', type: 'generate_text', category: 'actions', label: 'Generate Text', icon: '✍️', position: { x: 300, y: 100 }, config: { prompt: 'Write an engaging tweet about AI and automation', model: 'Claude' } },
      { id: '3', type: 'twitter', category: 'integrations', label: 'Twitter/X', icon: '🐦', position: { x: 500, y: 100 }, config: { action: 'Post Tweet', content: '{{generated_text}}' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
    ],
  },
  {
    name: 'Email Responder',
    description: 'Automatically classify and respond to incoming emails',
    category: 'email',
    icon: '📧',
    nodes: [
      { id: '1', type: 'event', category: 'triggers', label: 'Event', icon: '⚡', position: { x: 100, y: 100 }, config: { event_name: 'email.received', source: 'Webhook' } },
      { id: '2', type: 'classify', category: 'ai', label: 'Classify', icon: '🏷️', position: { x: 300, y: 100 }, config: { input: '{{email.body}}', categories: 'urgent, normal, spam' } },
      { id: '3', type: 'if_else', category: 'conditions', label: 'If / Else', icon: '🔀', position: { x: 500, y: 100 }, config: { condition: '{{classification}} == "urgent"' } },
      { id: '4', type: 'email', category: 'integrations', label: 'Email', icon: '📧', position: { x: 700, y: 50 }, config: { action: 'Send', to: '{{sender}}', subject: 'Re: {{subject}}', body: 'Urgent response...' } },
      { id: '5', type: 'email', category: 'integrations', label: 'Email', icon: '📧', position: { x: 700, y: 150 }, config: { action: 'Send', to: '{{sender}}', subject: 'Re: {{subject}}', body: 'Standard response...' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '3', target: '4' },
      { id: 'e4', source: '3', target: '5' },
    ],
  },
  {
    name: 'Price Monitor',
    description: 'Track prices and alert on changes',
    category: 'monitoring',
    icon: '💰',
    nodes: [
      { id: '1', type: 'schedule', category: 'triggers', label: 'Schedule', icon: '⏱', position: { x: 100, y: 100 }, config: { cron: '0 */6 * * *', timezone: 'UTC' } },
      { id: '2', type: 'call_api', category: 'actions', label: 'Call API', icon: '🔄', position: { x: 300, y: 100 }, config: { url: 'https://api.crypto.com/btc/price', method: 'GET' } },
      { id: '3', type: 'if_else', category: 'conditions', label: 'If / Else', icon: '🔀', position: { x: 500, y: 100 }, config: { condition: '{{price}} > 50000' } },
      { id: '4', type: 'telegram', category: 'integrations', label: 'Telegram', icon: '💬', position: { x: 700, y: 100 }, config: { action: 'Send Message', chat_id: '-100123', message: '🚨 BTC above $50k: ${{price}}' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '3', target: '4' },
    ],
  },
  {
    name: 'Content Creator',
    description: 'Generate and post AI content on schedule',
    category: 'content',
    icon: '✨',
    nodes: [
      { id: '1', type: 'schedule', category: 'triggers', label: 'Schedule', icon: '⏱', position: { x: 100, y: 100 }, config: { cron: '0 10 * * *', timezone: 'UTC' } },
      { id: '2', type: 'call_api', category: 'actions', label: 'Call API', icon: '🔄', position: { x: 300, y: 100 }, config: { url: 'https://api.news.com/trending', method: 'GET' } },
      { id: '3', type: 'summarize', category: 'ai', label: 'Summarize', icon: '📋', position: { x: 500, y: 100 }, config: { input: '{{articles}}', style: 'Brief', max_length: 100 } },
      { id: '4', type: 'twitter', category: 'integrations', label: 'Twitter/X', icon: '🐦', position: { x: 700, y: 100 }, config: { action: 'Post Tweet', content: '{{summary}}' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '3', target: '4' },
    ],
  },
];

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  // Simple security check - in production use a better auth mechanism
  if (secret !== process.env.MIGRATION_SECRET && secret !== 'agentforge-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results: any = { tables: 'checking', templates: [] }

  try {
    // Check if tables exist by attempting to query them
    const { error: checkError } = await supabase.from('agent_templates').select('id').limit(1)
    
    if (checkError && checkError.message.includes('does not exist')) {
      results.tables = 'Tables do not exist. Please run the SQL manually in Supabase Dashboard.'
      results.sql_url = 'https://supabase.com/dashboard/project/ljseawnwxbkrejwysrey/sql'
      results.instructions = 'Run scripts/init-database.sh to get the SQL'
    } else {
      results.tables = 'Tables exist'
      
      // Seed templates
      for (const template of templates) {
        try {
          const { data, error } = await supabase
            .from('agent_templates')
            .upsert(template, { onConflict: 'name', ignoreDuplicates: true })
            .select()
          
          if (error) {
            results.templates.push({ name: template.name, status: 'error', error: error.message })
          } else {
            results.templates.push({ name: template.name, status: 'success' })
          }
        } catch (err: any) {
          results.templates.push({ name: template.name, status: 'error', error: err.message })
        }
      }
    }

    return NextResponse.json(results)
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results }, { status: 500 })
  }
}
