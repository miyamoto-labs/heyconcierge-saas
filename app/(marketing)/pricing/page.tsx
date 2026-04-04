import { EarlyAccessPricing } from '@/components/EarlyAccessPricing'

export const metadata = {
  title: 'Pricing — HeyConcierge',
  description: 'Early access pricing for HeyConcierge. Lock in your rate for life before the public launch price increase.',
}

export default function PricingPage() {
  return (
    <div className="earth-page min-h-screen bg-white px-6 py-28">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-grove tracking-wide mb-4">Pricing</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-earth-dark leading-tight mb-4">
            Simple. One price. No surprises.
          </h1>
          <p className="text-base text-earth-muted max-w-md mx-auto">
            One flat rate per property per month. Add as many properties as you manage, up to 10.
          </p>
        </div>

        {/* Pricing card */}
        <EarlyAccessPricing />

        {/* FAQ-style objection handlers */}
        <div className="mt-20 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
          {[
            {
              q: 'What happens after the trial?',
              a: "You're charged the early access rate — locked in for as long as you stay subscribed. If prices go up at public launch, yours doesn't.",
            },
            {
              q: 'Can I add more properties later?',
              a: 'Yes. Each additional property is billed at the same per-property rate. Up to 10 properties. Above that, contact us for enterprise pricing.',
            },
            {
              q: 'What counts as a property?',
              a: 'Each unique address or rental unit is one property. A duplex you rent as two separate units = two properties.',
            },
            {
              q: 'Is there a long-term contract?',
              a: 'No. Month-to-month. Cancel from your dashboard at any time — no calls, no hoops.',
            },
          ].map((item, i) => (
            <div key={i} className="border-t border-earth-border pt-5">
              <p className="text-sm font-medium text-earth-dark mb-1.5">{item.q}</p>
              <p className="text-sm text-earth-muted leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
