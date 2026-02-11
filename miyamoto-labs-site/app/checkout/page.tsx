"use client";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const allPlans = [
  { id: "trustclaw-free", product: "TrustClaw", tier: "Free", price: 0 },
  { id: "trustclaw-pro", product: "TrustClaw", tier: "Pro", price: 29 },
  { id: "trustclaw-enterprise", product: "TrustClaw", tier: "Enterprise", price: null },
  { id: "agent-dashboard-free", product: "Agent Dashboard", tier: "Free", price: 0 },
  { id: "agent-dashboard-pro", product: "Agent Dashboard", tier: "Pro", price: 19 },
  { id: "agent-monitor-starter", product: "Agent Monitor", tier: "Starter", price: 19 },
  { id: "agent-monitor-pro", product: "Agent Monitor", tier: "Pro", price: 49 },
  { id: "no-code-builder-standard", product: "No-Code Agent Builder", tier: "Standard", price: 29 },
  { id: "no-code-builder-pro", product: "No-Code Agent Builder", tier: "Pro", price: 79 },
  { id: "trading-bot-standard", product: "Trading Bot Suite", tier: "Standard", price: 99 },
];

const paidPlans = allPlans.filter((p) => p.price && p.price > 0);

const WALLET = "0x114B7A51A4cF04897434408bd9003626705a2208";

function CheckoutInner() {
  const params = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [method, setMethod] = useState<"card" | "crypto" | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    const product = params.get("product");
    const plan = params.get("plan");
    if (product && plan) {
      const match = paidPlans.find(
        (p) => p.product.toLowerCase().replace(/\s+/g, "-") === product && p.tier.toLowerCase() === plan
      );
      if (match) {
        setSelectedId(match.id);
        setStep(2);
      }
    } else if (product) {
      const match = paidPlans.find((p) => p.product.toLowerCase().replace(/\s+/g, "-") === product);
      if (match) {
        setSelectedId(match.id);
        setStep(2);
      }
    }
  }, [params]);

  const selected = paidPlans.find((p) => p.id === selectedId) || null;

  const copyWallet = () => {
    navigator.clipboard.writeText(WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    const subject = `Payment Confirmation: ${selected?.product} ${selected?.tier}`;
    const body = `Payment sent for ${selected?.product} (${selected?.tier}) - $${selected?.price}/mo\n\nCustomer email: ${email}\nPayment method: Crypto (Base chain)\nAmount: $${selected?.price} USDC`;
    window.open(`mailto:dostoyevskyai@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setConfirmed(true);
  };

  // Group plans by product
  const grouped = paidPlans.reduce((acc, p) => {
    if (!acc[p.product]) acc[p.product] = [];
    acc[p.product].push(p);
    return acc;
  }, {} as Record<string, typeof paidPlans>);

  return (
    <main className="min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Checkout</h1>
          <p className="text-white/40 text-lg mb-12">Select a product, choose your plan, and pay.</p>
        </motion.div>

        {/* Steps indicator */}
        <div className="flex items-center gap-4 mb-12">
          {["Product & Plan", "Payment Method", "Complete"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1 ? "bg-accent text-white" : step === i + 1 ? "bg-accent/20 text-accent border border-accent/50" : "bg-white/5 text-white/20"
              }`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i + 1 ? "text-white/60" : "text-white/20"}`}>{s}</span>
              {i < 2 && <div className="w-8 h-px bg-white/5" />}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Step 1: Select Plan */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">1. Select Product & Plan</h2>
              <div className="space-y-6">
                {Object.entries(grouped).map(([product, plans]) => (
                  <div key={product}>
                    <h3 className="text-sm font-medium text-white/60 mb-2">{product}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plans.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedId(p.id); setStep(2); setMethod(null); setConfirmed(false); }}
                          className={`text-left p-4 rounded-lg border transition-all ${
                            selectedId === p.id
                              ? "border-accent bg-accent/10"
                              : "border-white/5 bg-surface hover:border-white/10"
                          }`}
                        >
                          <div className="font-medium text-sm">{p.tier}</div>
                          <div className="text-accent font-mono text-lg mt-1">
                            {p.price ? `$${p.price}` : "Custom"}<span className="text-white/30 text-sm">/mo</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step 2: Payment Method */}
            {selected && step >= 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">2. Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => { setMethod("card"); setStep(3); }}
                    className={`p-5 rounded-lg border transition-all text-left ${
                      method === "card" ? "border-accent bg-accent/10" : "border-white/5 bg-surface hover:border-white/10"
                    }`}
                  >
                    <div className="text-2xl mb-2">💳</div>
                    <div className="font-medium text-sm">Pay with Card</div>
                    <div className="text-white/30 text-xs mt-1">Visa, Mastercard, Amex via Stripe</div>
                  </button>
                  <button
                    onClick={() => { setMethod("crypto"); setStep(3); }}
                    className={`p-5 rounded-lg border transition-all text-left ${
                      method === "crypto" ? "border-accent bg-accent/10" : "border-white/5 bg-surface hover:border-white/10"
                    }`}
                  >
                    <div className="text-2xl mb-2">⟠</div>
                    <div className="font-medium text-sm">Pay with Crypto</div>
                    <div className="text-white/30 text-xs mt-1">USDC or ETH on Base</div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Complete Payment */}
            {selected && method === "card" && step >= 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gradient-border p-8">
                <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">3. Complete Payment</h2>
                <p className="text-white/50 text-sm mb-6">
                  You&apos;ll be redirected to our secure Stripe checkout for <strong className="text-white">{selected.product} ({selected.tier})</strong>.
                </p>
                <div className="bg-black border border-white/5 rounded-lg p-6 mb-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/30 block mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/30 block mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/30 block mb-1">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/30 block mb-1">CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <a
                  href={`https://checkout.stripe.com/pay/placeholder_${selected.id}`}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white px-6 py-3 rounded-lg font-medium transition-colors w-full justify-center"
                >
                  Pay ${selected.price}/mo →
                </a>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-white/15 text-xs">🔒</span>
                  <p className="text-white/20 text-xs">Powered by Stripe. 256-bit SSL encryption.</p>
                </div>
              </motion.div>
            )}

            {selected && method === "crypto" && step >= 3 && !confirmed && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gradient-border p-8">
                <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">3. Send Crypto Payment</h2>
                <p className="text-white/50 text-sm mb-6">
                  Send <strong className="text-accent">${selected.price} USDC</strong> (or equivalent ETH) on <strong className="text-white">Base</strong> chain.
                </p>

                <div className="flex justify-center mb-6">
                  <div className="bg-white rounded-xl p-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ethereum:${WALLET}@8453&color=000000&bgcolor=ffffff`}
                      alt="Payment QR Code"
                      width={180}
                      height={180}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="bg-black rounded-lg p-5 border border-white/5 mb-6">
                  <div className="text-xs text-white/30 uppercase tracking-wider mb-2">Send to (Base Network)</div>
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono text-accent break-all flex-1">{WALLET}</code>
                    <button
                      onClick={copyWallet}
                      className="shrink-0 text-xs border border-white/10 hover:border-accent/50 px-3 py-1.5 rounded-md text-white/50 hover:text-white transition-all"
                    >
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="bg-surface rounded-lg p-4 border border-white/5 mb-6 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-white/30">Network</span><span className="text-white/60">Base (Ethereum L2)</span></div>
                  <div className="flex justify-between"><span className="text-white/30">Token</span><span className="text-white/60">USDC or ETH</span></div>
                  <div className="flex justify-between"><span className="text-white/30">Amount</span><span className="text-accent font-mono">${selected.price}.00 USDC</span></div>
                  <div className="flex justify-between"><span className="text-white/30">Product</span><span className="text-white/60">{selected.product} ({selected.tier})</span></div>
                </div>

                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email for confirmation"
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleConfirm}
                    disabled={!email}
                    className="w-full bg-accent hover:bg-accent-light disabled:bg-white/5 disabled:text-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm"
                  >
                    I&apos;ve Sent the Payment →
                  </button>
                </div>
                <p className="text-white/15 text-xs mt-3 text-center">We&apos;ll verify on-chain and activate your subscription within 24h.</p>
              </motion.div>
            )}

            {confirmed && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="gradient-border p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-xl font-bold mb-2">Payment Confirmation Sent</h2>
                <p className="text-white/40 text-sm mb-4">
                  We&apos;ll verify your payment and activate your <strong className="text-white">{selected?.product} ({selected?.tier})</strong> subscription.
                  You&apos;ll receive a confirmation email at <strong className="text-accent">{email}</strong>.
                </p>
                <p className="text-white/20 text-xs">Typical activation time: &lt; 24 hours</p>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="hidden md:block">
            <div className="sticky top-24">
              <div className="gradient-border p-6">
                <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Order Summary</h3>
                {selected ? (
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium">{selected.product}</div>
                      <div className="text-sm text-white/40">{selected.tier} Plan</div>
                    </div>
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Monthly</span>
                        <span className="text-accent font-mono">${selected.price}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-white/40">Billed</span>
                        <span className="text-white/60">Monthly</span>
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-accent font-mono text-lg">${selected.price}/mo</span>
                      </div>
                    </div>
                    {method && (
                      <div className="text-xs text-white/20 flex items-center gap-1.5">
                        <span>{method === "card" ? "💳" : "⟠"}</span>
                        {method === "card" ? "Card via Stripe" : "Crypto on Base"}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-white/20 text-sm">Select a plan to see summary</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Checkout() {
  return (
    <>
      <Nav />
      <Suspense fallback={<main className="min-h-screen pt-32 pb-24"><div className="mx-auto max-w-4xl px-6"><div className="text-white/20">Loading...</div></div></main>}>
        <CheckoutInner />
      </Suspense>
      <Footer />
    </>
  );
}
