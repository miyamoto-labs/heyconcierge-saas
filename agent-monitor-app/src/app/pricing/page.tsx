'use client'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    desc: 'For side projects and experimentation',
    agents: '3 agents',
    highlight: false,
    features: [
      '3 agents',
      '1,000 events/day',
      '24h data retention',
      'Email alerts',
      'Community support',
      '1 team member',
    ],
    missing: ['Custom alert rules', 'Webhooks', 'API access', 'SSO', 'SLA'],
    cta: 'Start Free',
  },
  {
    name: 'Pro',
    price: '$19',
    desc: 'For teams shipping agents to production',
    agents: '25 agents',
    highlight: true,
    features: [
      '25 agents',
      '100,000 events/day',
      '30-day data retention',
      'Slack, Discord, email alerts',
      'Custom alert rules',
      'Webhooks',
      'Full API access',
      '5 team members',
      'Priority support',
    ],
    missing: ['SSO', 'Custom SLA'],
    cta: 'Start Pro Trial',
  },
  {
    name: 'Business',
    price: '$49',
    desc: 'For organizations running agent fleets',
    agents: 'Unlimited agents',
    highlight: false,
    features: [
      'Unlimited agents',
      'Unlimited events',
      '1-year data retention',
      'All alert channels',
      'Custom alert rules',
      'Webhooks + custom integrations',
      'Full API access',
      'Unlimited team members',
      'SSO / SAML',
      'Custom SLA',
      'Dedicated support',
      'On-prem option',
    ],
    missing: [],
    cta: 'Contact Sales',
  },
]

export default function Pricing() {
  return (
    <main className="pt-20 pb-16 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Simple, honest pricing</h1>
        <p className="text-zinc-400 text-lg">Start free. Scale as your agent fleet grows.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {tiers.map(t => (
          <div
            key={t.name}
            className={`rounded-2xl border p-8 flex flex-col ${
              t.highlight
                ? 'bg-healthy/5 border-healthy/30 glow-green relative'
                : 'bg-surface-2 border-border'
            }`}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-healthy text-black text-xs font-bold">
                Most Popular
              </div>
            )}
            <div className="text-sm text-zinc-500 mb-1">{t.name}</div>
            <div className="text-5xl font-bold text-white mb-1">
              {t.price}<span className="text-lg text-zinc-500 font-normal">/mo</span>
            </div>
            <div className="text-sm text-zinc-400 mb-6">{t.desc}</div>

            <button
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors mb-8 ${
                t.highlight
                  ? 'bg-healthy text-black hover:bg-healthy/90'
                  : 'bg-white/5 text-white hover:bg-white/10 border border-border'
              }`}
            >
              {t.cta}
            </button>

            <div className="space-y-3 flex-1">
              {t.features.map(f => (
                <div key={f} className="flex items-center gap-3 text-sm">
                  <span className="text-healthy">✓</span>
                  <span className="text-zinc-300">{f}</span>
                </div>
              ))}
              {t.missing.map(f => (
                <div key={f} className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-600">—</span>
                  <span className="text-zinc-600">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">FAQ</h2>
        <div className="space-y-4">
          {[
            { q: 'What counts as an "agent"?', a: 'Any unique agent ID sending events or heartbeats. You can monitor different versions of the same agent under one ID.' },
            { q: 'What happens if I exceed my event limit?', a: 'Events are buffered for 1 hour. If you\'re consistently over, we\'ll nudge you to upgrade. We never drop your data without warning.' },
            { q: 'Can I self-host?', a: 'Business plan includes an on-prem option. Contact us for details.' },
            { q: 'Is there a free trial for Pro?', a: 'Yes — 14 days, no credit card required.' },
          ].map(f => (
            <div key={f.q} className="p-5 rounded-xl bg-surface-2 border border-border">
              <div className="font-medium text-white mb-2">{f.q}</div>
              <div className="text-sm text-zinc-400">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
