export type PlanType = 'free' | 'pro' | 'team'

export const PLAN_LIMITS = {
  free: {
    maxProjects: 1,
    templates: ['support', 'monitoring', 'content'] as string[],
    exports: ['json'] as string[],
    maxRuns: 100,
  },
  pro: {
    maxProjects: 10,
    templates: 'all' as const,
    exports: ['json', 'openclaw', 'python', 'docker'] as string[],
    maxRuns: Infinity,
  },
  team: {
    maxProjects: Infinity,
    templates: 'all' as const,
    exports: ['json', 'openclaw', 'python', 'docker', 'whitelabel'] as string[],
    maxRuns: Infinity,
  },
}

// Template IDs that are free
export const FREE_TEMPLATE_IDS = ['t1', 't7', 't5'] // Customer Support, Price Monitor, Content Creator

// Map template IDs to plan requirements
export const TEMPLATE_PLAN_MAP: Record<string, PlanType> = {
  t1: 'free',   // Customer Support Bot
  t2: 'pro',    // Social Media Manager
  t3: 'pro',    // Email Responder
  t4: 'pro',    // Data Pipeline
  t5: 'free',   // Content Creator
  t6: 'pro',    // Lead Qualifier
  t7: 'free',   // Price Monitor
  t8: 'pro',    // Meeting Summarizer
  t9: 'pro',    // Sentiment Analyzer
  t10: 'pro',   // Multi-Channel Bot
}

export const EXPORT_FORMAT_LABELS: Record<string, string> = {
  json: 'JSON',
  openclaw: 'OpenClaw Config',
  python: 'Python Script',
  docker: 'Docker',
  whitelabel: 'White-label',
}

export function canExport(plan: PlanType, format: string): boolean {
  return PLAN_LIMITS[plan].exports.includes(format)
}

export function canUseTemplate(plan: PlanType, templateId: string): boolean {
  if (PLAN_LIMITS[plan].templates === 'all') return true
  return FREE_TEMPLATE_IDS.includes(templateId)
}

export function canCreateProject(plan: PlanType, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxProjects
}
