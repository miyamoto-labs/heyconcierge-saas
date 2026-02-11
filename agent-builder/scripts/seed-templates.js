#!/usr/bin/env node
/**
 * Seed starter templates into agent_templates table
 * Run: node scripts/seed-templates.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ljseawnwxbkrejwysrey.supabase.co';
const SERVICE_KEY = 'sb_secret_Brfx07Yxp_L7YLwE012lAA_xKsD-EtY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

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
    name: 'Data Pipeline',
    description: 'Fetch, transform, and process data from APIs',
    category: 'data',
    icon: '🔄',
    nodes: [
      { id: '1', type: 'webhook', category: 'triggers', label: 'Webhook', icon: '🔗', position: { x: 100, y: 100 }, config: { path: '/pipeline', method: 'POST' } },
      { id: '2', type: 'call_api', category: 'actions', label: 'Call API', icon: '🔄', position: { x: 300, y: 100 }, config: { url: 'https://api.example.com/data', method: 'GET' } },
      { id: '3', type: 'filter', category: 'conditions', label: 'Filter', icon: '🔢', position: { x: 500, y: 100 }, config: { field: 'data.items', condition: 'item.value > 1000' } },
      { id: '4', type: 'run_script', category: 'actions', label: 'Run Script', icon: '📜', position: { x: 700, y: 100 }, config: { language: 'Python', code: '# Transform data\nfor item in data:\n  item["processed"] = True' } },
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
  {
    name: 'Lead Qualifier',
    description: 'Qualify and route incoming leads automatically',
    category: 'sales',
    icon: '🎯',
    nodes: [
      { id: '1', type: 'webhook', category: 'triggers', label: 'Webhook', icon: '🔗', position: { x: 100, y: 100 }, config: { path: '/leads', method: 'POST' } },
      { id: '2', type: 'extract', category: 'ai', label: 'Extract', icon: '🔍', position: { x: 300, y: 100 }, config: { input: '{{body}}', fields: 'company, size, budget, need' } },
      { id: '3', type: 'classify', category: 'ai', label: 'Classify', icon: '🏷️', position: { x: 500, y: 100 }, config: { input: '{{extracted}}', categories: 'hot, warm, cold' } },
      { id: '4', type: 'slack', category: 'integrations', label: 'Slack', icon: '💼', position: { x: 700, y: 100 }, config: { action: 'Send Message', channel: '#sales', message: 'New {{category}} lead: {{company}}' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '3', target: '4' },
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
    name: 'Meeting Summarizer',
    description: 'Summarize meeting notes and send to attendees',
    category: 'productivity',
    icon: '📝',
    nodes: [
      { id: '1', type: 'event', category: 'triggers', label: 'Event', icon: '⚡', position: { x: 100, y: 100 }, config: { event_name: 'meeting.ended', source: 'Internal' } },
      { id: '2', type: 'summarize', category: 'ai', label: 'Summarize', icon: '📋', position: { x: 300, y: 100 }, config: { input: '{{transcript}}', style: 'Bullet Points', max_length: 300 } },
      { id: '3', type: 'email', category: 'integrations', label: 'Email', icon: '📧', position: { x: 500, y: 100 }, config: { action: 'Send', to: '{{attendees}}', subject: 'Meeting Summary: {{title}}', body: '{{summary}}' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
    ],
  },
  {
    name: 'Sentiment Analyzer',
    description: 'Analyze sentiment of incoming messages and alert',
    category: 'analytics',
    icon: '😊',
    nodes: [
      { id: '1', type: 'webhook', category: 'triggers', label: 'Webhook', icon: '🔗', position: { x: 100, y: 100 }, config: { path: '/feedback', method: 'POST' } },
      { id: '2', type: 'classify', category: 'ai', label: 'Classify', icon: '🏷️', position: { x: 300, y: 100 }, config: { input: '{{message}}', categories: 'positive, negative, neutral' } },
      { id: '3', type: 'filter', category: 'conditions', label: 'Filter', icon: '🔢', position: { x: 500, y: 100 }, config: { field: 'sentiment', condition: 'sentiment == "negative"' } },
      { id: '4', type: 'slack', category: 'integrations', label: 'Slack', icon: '💼', position: { x: 700, y: 100 }, config: { action: 'Send Message', channel: '#alerts', message: '⚠️ Negative feedback: {{message}}' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '3', target: '4' },
    ],
  },
  {
    name: 'Multi-Channel Bot',
    description: 'Route messages to different channels based on content',
    category: 'messaging',
    icon: '🤖',
    nodes: [
      { id: '1', type: 'event', category: 'triggers', label: 'Event', icon: '⚡', position: { x: 100, y: 100 }, config: { event_name: 'message.received', source: 'Webhook' } },
      { id: '2', type: 'switch', category: 'conditions', label: 'Switch', icon: '🔃', position: { x: 300, y: 100 }, config: { variable: '{{channel}}', cases: 'telegram, slack, email' } },
      { id: '3', type: 'telegram', category: 'integrations', label: 'Telegram', icon: '💬', position: { x: 500, y: 50 }, config: { action: 'Send Message', chat_id: '-100123', message: '{{message}}' } },
      { id: '4', type: 'slack', category: 'integrations', label: 'Slack', icon: '💼', position: { x: 500, y: 150 }, config: { action: 'Send Message', channel: '#general', message: '{{message}}' } },
      { id: '5', type: 'email', category: 'integrations', label: 'Email', icon: '📧', position: { x: 500, y: 250 }, config: { action: 'Send', to: '{{recipient}}', subject: 'Message', body: '{{message}}' } },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '2', target: '4' },
      { id: 'e4', source: '2', target: '5' },
    ],
  },
];

async function seedTemplates() {
  console.log('🌱 Seeding templates...\n');

  for (const template of templates) {
    console.log(`   Inserting: ${template.name}`);
    const { data, error } = await supabase
      .from('agent_templates')
      .upsert(template, { onConflict: 'name' });

    if (error) {
      console.error(`   ❌ Error inserting ${template.name}:`, error.message);
    } else {
      console.log(`   ✅ ${template.name}`);
    }
  }

  console.log('\n✨ Template seeding complete!');
}

seedTemplates().catch(console.error);
