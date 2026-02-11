"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const TELEGRAM_URL = "https://t.me/EasyPolyBot";

/* ───── Animations ───── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={`relative px-5 sm:px-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

/* ───── CTA Button ───── */
function CTAButton({ size = "lg" }: { size?: "lg" | "md" | "sm" }) {
  const sizes = {
    lg: "px-8 py-4 text-lg",
    md: "px-6 py-3 text-base",
    sm: "px-5 py-2.5 text-sm",
  };
  return (
    <motion.a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2.5 rounded-xl bg-brand-green font-bold text-brand-dark ${sizes[size]} transition-shadow hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]`}
    >
      <TelegramIcon />
      Join Beta on Telegram
    </motion.a>
  );
}

function TelegramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.291c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
    </svg>
  );
}

/* ───── Logo ───── */
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10">
        <svg viewBox="0 0 512 512" className="h-full w-full">
          <rect width="512" height="512" fill="#111827" rx="64" />
          <g transform="translate(256,256)">
            <circle cx="0" cy="0" r="120" fill="none" stroke="#10B981" strokeWidth="8" opacity="0.3" />
            <circle cx="0" cy="0" r="80" fill="none" stroke="#10B981" strokeWidth="10" opacity="0.6" />
            <circle cx="0" cy="0" r="40" fill="#10B981" />
            <path d="M-140,60 L-80,20 L-20,-20 L40,-60 L100,-100 L140,-140" fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round" />
            <circle cx="140" cy="-140" r="8" fill="#10B981" />
            <circle cx="100" cy="-100" r="6" fill="#10B981" />
            <circle cx="40" cy="-60" r="6" fill="#10B981" />
          </g>
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight">
        Easy<span className="text-brand-green">Poly</span>
      </span>
    </div>
  );
}

/* ───── Navbar ───── */
function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-brand-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
          <a href="#how" className="transition hover:text-white">How It Works</a>
          <a href="#preview" className="transition hover:text-white">Preview</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
        </div>
        <CTAButton size="sm" />
      </div>
    </nav>
  );
}

/* ───── Hero ───── */
function Hero() {
  return (
    <Section className="flex min-h-screen flex-col items-center justify-center pt-20 text-center">
      <motion.div
        variants={fadeUp}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-4 py-1.5 text-sm text-brand-green"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
        </span>
        Free during Beta
      </motion.div>
      <motion.h1
        variants={fadeUp}
        className="max-w-4xl text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
      >
        AI-Curated{" "}
        <span className="bg-gradient-to-r from-brand-green to-emerald-300 bg-clip-text text-transparent">
          Polymarket Picks
        </span>
        <br />
        Delivered to Telegram
      </motion.h1>
      <motion.p
        variants={fadeUp}
        className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl"
      >
        Get 3 daily picks in Telegram. AI analyzes 300+ markets and finds the best opportunities. Bet or skip in 1 tap.
      </motion.p>
      <motion.div variants={fadeUp} className="mt-10">
        <CTAButton />
      </motion.div>
      <motion.div
        variants={fadeUp}
        className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
      >
        <span className="flex items-center gap-1.5">
          <CheckIcon /> No signup
        </span>
        <span className="flex items-center gap-1.5">
          <CheckIcon /> Free beta
        </span>
        <span className="flex items-center gap-1.5">
          <CheckIcon /> Connect wallet when ready
        </span>
      </motion.div>
      {/* Gradient orb */}
      <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-brand-green/5 blur-[120px]" />
    </Section>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ───── How It Works ───── */
const steps = [
  {
    num: "01",
    title: "AI Scans Markets",
    desc: "Our Claude-powered AI analyzes 300+ Polymarket markets twice daily, hunting for mispricings and statistical edges.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.573.097c-3.04.516-6.147.516-9.187 0l-.573-.097c-1.717-.293-2.3-2.379-1.067-3.61L10 15.5" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "You Get Picks",
    desc: "Receive 2–3 curated picks in Telegram with AI reasoning, probability analysis, and clear entry points.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "One Tap to Bet",
    desc: "Hit $5, $10, or $25 — your bet is placed directly on Polymarket. No copy-pasting, no switching apps.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
      </svg>
    ),
  },
];

function HowItWorks() {
  return (
    <Section id="how" className="mx-auto max-w-6xl py-28">
      <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-green">
        How It Works
      </motion.p>
      <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-bold sm:text-4xl">
        From AI scan to placed bet in <span className="text-brand-green">under 10 seconds</span>
      </motion.h2>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <motion.div
            key={step.num}
            variants={fadeUp}
            className="group relative rounded-2xl border border-white/5 bg-brand-card p-8 transition hover:border-brand-green/20 hover:glow-sm"
          >
            <span className="font-mono text-sm text-brand-green/50">{step.num}</span>
            <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
              {step.icon}
            </div>
            <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-gray-400 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ───── Live Preview (Mock Telegram Card) ───── */
function LivePreview() {
  const [betPlaced, setBetPlaced] = useState<string | null>(null);

  return (
    <Section id="preview" className="mx-auto max-w-6xl py-28">
      <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-green">
        Live Preview
      </motion.p>
      <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-bold sm:text-4xl">
        This is what you get in Telegram
      </motion.h2>
      <motion.p variants={fadeUp} className="mt-3 max-w-lg text-gray-400">
        Every pick arrives as a clean card with AI reasoning and one-tap bet buttons. Here's a real example:
      </motion.p>

      <motion.div variants={fadeUp} className="mt-12 flex justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e2c3a] p-0 shadow-2xl glow">
          {/* Telegram header */}
          <div className="flex items-center gap-3 rounded-t-2xl bg-[#17212b] px-5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green">
              <svg viewBox="0 0 512 512" className="h-5 w-5">
                <g transform="translate(256,256)">
                  <circle cx="0" cy="0" r="40" fill="#111827" />
                </g>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">EasyPoly Bot</p>
              <p className="text-xs text-gray-400">online</p>
            </div>
          </div>
          {/* Message */}
          <div className="space-y-4 p-5">
            <div className="rounded-xl bg-[#2b5278]/50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="font-bold text-brand-green">NEW PICK</span>
                <span className="ml-auto rounded-full bg-brand-green/20 px-2 py-0.5 text-xs font-semibold text-brand-green">
                  HIGH EDGE
                </span>
              </div>
              <div className="mt-3 border-l-2 border-brand-green/40 pl-3">
                <p className="font-semibold text-white">
                  Will Bitcoin hit $150k before July 2026?
                </p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-gray-400">
                    Market: <span className="text-white">38¢</span>
                  </span>
                  <span className="text-gray-400">
                    Our estimate: <span className="text-brand-green font-semibold">62%</span>
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                <span className="text-brand-green font-medium">AI Analysis:</span> On-chain metrics show institutional accumulation pattern similar to pre-$100k breakout. ETF inflows accelerating. Market significantly underpricing this outcome.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <span>📊 Edge: +24%</span>
                <span>•</span>
                <span>⏰ 2 min ago</span>
              </div>
            </div>
            {/* Bet buttons */}
            <div className="grid grid-cols-3 gap-2">
              {["$5", "$10", "$25"].map((amt) => (
                <motion.button
                  key={amt}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBetPlaced(amt)}
                  className={`rounded-lg py-2.5 text-sm font-bold transition ${
                    betPlaced === amt
                      ? "bg-brand-green text-brand-dark"
                      : "bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
                  }`}
                >
                  {betPlaced === amt ? "✓ Placed!" : `BET ${amt}`}
                </motion.button>
              ))}
            </div>
            <button className="w-full rounded-lg bg-white/5 py-2 text-sm text-gray-400 hover:bg-white/10 transition">
              Custom amount...
            </button>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

/* ───── Pricing ───── */
const plans = [
  {
    name: "Beta",
    price: "Free",
    period: "Limited spots",
    features: [
      "2–3 AI picks daily",
      "Full AI reasoning & analysis",
      "Telegram delivery",
      "Manual bet execution",
    ],
    cta: true,
    highlight: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "Everything in Beta",
      "Priority picks",
      "Custom market filters",
      "Performance dashboard",
    ],
    cta: false,
    highlight: false,
    badge: "Coming Soon",
  },
  {
    name: "Auto",
    price: "$79",
    period: "/month",
    features: [
      "Everything in Pro",
      "One-tap auto-execution",
      "Custom bet sizing",
      "Stop-loss automation",
    ],
    cta: false,
    highlight: false,
    badge: "Coming Soon",
  },
];

function Pricing() {
  return (
    <Section id="pricing" className="mx-auto max-w-6xl py-28">
      <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-green">
        Pricing
      </motion.p>
      <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-bold sm:text-4xl">
        Start free. Upgrade when you're hooked.
      </motion.h2>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            variants={fadeUp}
            className={`relative rounded-2xl border p-8 ${
              plan.highlight
                ? "border-brand-green/30 bg-brand-card glow"
                : "border-white/5 bg-brand-card"
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 right-6 rounded-full bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300">
                {plan.badge}
              </span>
            )}
            {plan.highlight && (
              <span className="absolute -top-3 right-6 rounded-full bg-brand-green px-3 py-1 text-xs font-bold text-brand-dark">
                Available Now
              </span>
            )}
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-black">{plan.price}</span>
              <span className="text-gray-400">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              {plan.cta ? (
                <CTAButton size="md" />
              ) : (
                <div className="rounded-xl bg-white/5 py-3 text-center text-sm text-gray-500">
                  Coming soon
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ───── FAQ ───── */
const faqs = [
  {
    q: "How does EasyPoly find mispricings?",
    a: "Our AI (powered by Claude) analyzes 300+ Polymarket markets twice daily. It compares market prices against its own probability estimates using news analysis, on-chain data, and historical patterns to identify statistical edges of 10%+.",
  },
  {
    q: "Is my money safe?",
    a: "Your funds stay in your own Polymarket account. EasyPoly never holds your money — we simply send the bet instruction to Polymarket when you tap a button. You can revoke access anytime.",
  },
  {
    q: "What markets do you cover?",
    a: "Crypto, tech, politics, sports, economics — any active Polymarket market with sufficient liquidity. We focus on markets where our AI has the strongest statistical edge.",
  },
  {
    q: "How many picks per day?",
    a: "2–3 picks daily. We deliberately limit picks to only the highest-conviction opportunities. Quality over quantity — you won't get spammed.",
  },
  {
    q: "What's the track record?",
    a: "We're in beta and building our track record transparently. Every pick is timestamped and logged. We'll publish full performance stats once we have sufficient data.",
  },
  {
    q: "Will it always be free?",
    a: "The beta is free to build trust and gather feedback. We'll introduce paid tiers for advanced features like auto-execution, but basic picks will remain affordable.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Section id="faq" className="mx-auto max-w-3xl py-28">
      <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-green">
        FAQ
      </motion.p>
      <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-bold sm:text-4xl">
        Got questions?
      </motion.h2>

      <div className="mt-12 space-y-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="rounded-xl border border-white/5 bg-brand-card overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <span className="font-medium pr-4">{faq.q}</span>
              <motion.span
                animate={{ rotate: open === i ? 45 : 0 }}
                className="flex-shrink-0 text-xl text-brand-green"
              >
                +
              </motion.span>
            </button>
            <motion.div
              initial={false}
              animate={{
                height: open === i ? "auto" : 0,
                opacity: open === i ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="px-6 pb-5 text-gray-400 leading-relaxed">{faq.a}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ───── Final CTA ───── */
function FinalCTA() {
  return (
    <Section className="mx-auto max-w-4xl py-28 text-center">
      <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-5xl">
        AI finds the edge.
        <br />
        <span className="text-brand-green">You tap the button.</span>
      </motion.h2>
      <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-lg text-gray-400 text-lg">
        Join hundreds of traders getting AI-curated Polymarket picks delivered straight to Telegram.
      </motion.p>
      <motion.div variants={fadeUp} className="mt-8">
        <CTAButton />
      </motion.div>
    </Section>
  );
}

/* ───── Footer ───── */
function Footer() {
  return (
    <footer className="border-t border-white/5 px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          Built by{" "}
          <span className="font-semibold text-gray-400">Miyamoto Labs</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
            Telegram
          </a>
          <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
            Polymarket
          </a>
          <a href="mailto:hello@miyamotolabs.com" className="transition hover:text-white">
            Contact
          </a>
        </div>
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} EasyPoly. Not financial advice.
        </p>
      </div>
    </footer>
  );
}

/* ───── Page ───── */
export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <HowItWorks />
      <LivePreview />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
