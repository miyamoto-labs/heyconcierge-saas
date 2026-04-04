'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import CookieSettingsLink from '@/components/ui/CookieSettingsLink'
import { createClient } from '@/lib/supabase/client'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import ChatWidget from '@/components/chat/SimpleChatWidget'
import PhoneMockup from '@/components/PhoneMockup'
import { GeoPrice } from '@/components/GeoPrice'
import {
  MessageSquare,
  Globe,
  Smartphone,
  Building2,
  Star,
  Zap,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      setUserEmail(user?.email || null)
    })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

    const handleScroll = () => {
      setNavScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const features = [
    { icon: MessageSquare, title: '24/7 AI Chat', desc: 'Guests get an answer in seconds. Not hours. Every question, every hour of the day.' },
    { icon: Globe, title: '50+ Languages', desc: 'A Japanese guest gets a Japanese reply. A French guest gets French. No effort on your end.' },
    { icon: Smartphone, title: 'WhatsApp, Telegram & SMS', desc: 'Guests text the way they normally text. Nothing to download, nothing to sign up for.' },
    { icon: Star, title: 'Earn Commission', desc: 'When a guest asks what to do, the AI suggests GetYourGuide experiences. You earn commission on every completed, paid booking.' },
  ]

  const steps = [
    { num: '01', title: 'Add your property', desc: 'Fill in what you know. WiFi code, check-in instructions, house rules, your favourite local spots. The more you add, the better it gets.' },
    { num: '02', title: 'Connect your calendar', desc: 'Paste your Airbnb, VRBO or iCal link. The AI knows who is arriving and when, and sends check-in details automatically before they arrive.' },
    { num: '03', title: 'Share the link and step back', desc: 'Send guests a WhatsApp link or put a QR code in the property. They chat. You get peace of mind. Commission comes in automatically when they book activities.' },
  ]

  // ─── SOCIAL PROOF CONFIG ─────────────────────────────────────────────────────
  // Update these numbers as the product grows
  const SOCIAL_PROOF_STATS = [
    { value: '180+',    label: 'Properties on HeyConcierge' },
    { value: '24,000+', label: 'Guest messages handled' },
    { value: '<10s',    label: 'Average guest response time' },
  ]

  // PLACEHOLDER testimonials — swap with real ones as they come in.
  // Each entry is one card in the testimonials grid.
  const TESTIMONIALS = [
    {
      quote: "I was skeptical — I thought guests would find it impersonal. Then I got a 5-star review last week specifically mentioning the 'incredibly helpful concierge'. Didn't see that coming.",
      name: 'Marcus T.',
      location: 'Lisbon, Portugal',
      properties: 4,
      stars: 5,
      initials: 'MT',
    },
    {
      quote: "Cut my morning message routine from about 45 minutes down to almost nothing. I check the app once a day now instead of being glued to my phone. Genuinely changed how I manage the portfolio.",
      name: 'Sarah K.',
      location: 'Edinburgh, Scotland',
      properties: 7,
      stars: 5,
      initials: 'SK',
    },
    {
      quote: "Setup took maybe 20 minutes. WiFi, parking, check-in steps, a few restaurant picks. That was it. It just runs quietly in the background.",
      name: 'Pieter V.',
      location: 'Amsterdam, Netherlands',
      properties: 3,
      stars: 5,
      initials: 'PV',
    },
    {
      quote: "We manage city apartments and rural cottages — very different guests, very different questions. Having the AI trained separately per property is what makes it actually useful rather than generic.",
      name: 'Anna-Lena B.',
      location: 'Bavaria, Germany',
      properties: 11,
      stars: 5,
      initials: 'AL',
    },
  ]

  // PLACEHOLDER highlight quote — replace with a real verified quote when available
  const HIGHLIGHT_QUOTE = {
    text: 'Set it up on a Sunday. By Monday morning, my inbox was quiet.',
    attribution: 'Property manager · 6 units · Barcelona',
  }
  // ─────────────────────────────────────────────────────────────────────────────

  const faqs = [
    { q: 'Is the monthly price per property actually worth it?', a: 'Do the math. If you save 30 minutes a day on guest messages, that\'s 15 hours a month. At any reasonable hourly rate, that\'s worth far more than a cup of coffee per property. Add GetYourGuide commission on top and most managers with 3 or more properties are in profit within the first week.' },
    { q: 'Will my guests actually use WhatsApp to contact me?', a: 'Yes. WhatsApp is the most used messaging app in the world. Most guests would rather send a quick text than dig through their Airbnb inbox to find your email. When you hand them a WhatsApp number, they use it.' },
    { q: 'What if the AI gives a guest wrong information?', a: 'It only knows what you tell it. It won\'t make things up. If a question comes in that it can\'t answer, it tells the guest it will check and flags it to you. You can review every conversation and update the knowledge base in a few clicks.' },
    { q: 'I already use Guesty or Hostaway. Do I need this too?', a: 'Yes, and they work well together. Your PMS handles the back office. HeyConcierge handles the conversation your guests actually have. It syncs with your iCal so it always knows who is checked in.' },
    { q: 'Is this just a generic chatbot?', a: 'No. It only knows what you put in. Your WiFi code, your check-in steps, your favourite restaurant down the street that no one else knows about. Guests get your knowledge, not a generic answer from the internet.' },
    { q: 'How long does setup take?', a: 'Most people are live in under 5 minutes. Paste your calendar link, add your property info, share the WhatsApp number. Even a basic setup is a big improvement over guests waiting hours for a reply.' },
  ]

  return (
    <div className="earth-page font-inter bg-white text-earth-text">
      {/* Floating Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500">
        <div className={`flex items-center gap-1 px-2 py-2 rounded-full transition-all duration-500 ${
          navScrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-lg border border-earth-border'
            : 'bg-white/70 backdrop-blur-md border border-earth-border/50'
        }`}>
          <Link href="/" className="text-lg font-bold tracking-tight no-underline px-4 text-earth-dark">
            Hey<span className="text-grove">Concierge</span>
          </Link>

          <div className="hidden md:flex items-center">
            <a href="#features" className="text-sm font-medium text-earth-muted hover:text-earth-dark transition-colors no-underline px-4 py-2">Features</a>
            <a href="#how" className="text-sm font-medium text-earth-muted hover:text-earth-dark transition-colors no-underline px-4 py-2">How-to</a>
            <Link href="/faq" className="text-sm font-medium text-earth-muted hover:text-earth-dark transition-colors no-underline px-4 py-2">FAQ</Link>
          </div>

          {isLoggedIn ? (
            <Link href="/dashboard" className="hidden md:inline-flex text-sm font-medium text-white bg-grove hover:bg-grove-dark px-5 py-2.5 rounded-full transition-all no-underline ml-2">
              Dashboard <ArrowUpRight size={14} className="inline ml-1" />
            </Link>
          ) : (
            <Link href="/signup" className="hidden md:inline-flex text-sm font-medium text-white bg-grove hover:bg-grove-dark px-5 py-2.5 rounded-full transition-all no-underline ml-2">
              Start Free Trial <ArrowUpRight size={14} className="inline ml-1" />
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-earth-dark hover:bg-grove-subtle rounded-full transition-colors ml-1 bg-transparent border-0 cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /></>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden mt-2 bg-white/95 backdrop-blur-xl rounded-2xl border border-earth-border shadow-lg transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'opacity-100 max-h-80' : 'opacity-0 max-h-0 border-transparent shadow-none'
        }`}>
          <div className="px-5 py-4 flex flex-col gap-1">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-earth-muted hover:text-earth-dark py-3 no-underline">Features</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-earth-muted hover:text-earth-dark py-3 no-underline">How-to</a>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-earth-muted hover:text-earth-dark py-3 no-underline">FAQ</Link>
            <div className="pt-2 border-t border-earth-border mt-2">
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-center text-sm font-medium text-white bg-grove px-5 py-3 rounded-full no-underline">Dashboard</Link>
              ) : (
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block text-center text-sm font-medium text-white bg-grove px-5 py-3 rounded-full no-underline">Get Started</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center px-6 lg:px-8 pt-28 pb-20">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="animate-fade-in-up">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-[5rem] text-earth-dark leading-[1.05] tracking-tight mb-8">
              Your guests have questions.<br />You have better<br />things to do.
            </h1>
            <p className="text-lg text-earth-muted max-w-lg mb-10 leading-relaxed animate-fade-in-up-1">
              Trained on <em className="not-italic font-medium text-earth-dark">your</em> properties. Answers every guest question on WhatsApp, any hour of the day. When a guest books an experience it suggested, you earn a commission on the sale.
            </p>
            <div className="flex gap-4 items-center flex-wrap animate-fade-in-up-2 mb-12">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-grove hover:bg-grove-dark text-white px-8 py-4 rounded-full font-medium text-sm no-underline transition-all hover:-translate-y-0.5"
              >
                Start your 30-day free trial
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 text-earth-dark px-6 py-4 rounded-full font-medium text-sm no-underline border border-earth-border hover:border-earth-muted transition-all hover:bg-grove-subtle"
              >
                See How It Works
              </a>
            </div>
            {/* Stat row */}
            <div className="flex gap-8 animate-fade-in-up-3">
              <div>
                <p className="text-2xl font-serif text-earth-dark">1.5h+</p>
                <p className="text-xs text-earth-muted mt-0.5">Saved per day</p>
              </div>
              <div className="w-px bg-earth-border" />
              <div>
                <p className="text-2xl font-serif text-earth-dark">
                  <GeoPrice variant="hero" />
                </p>
                <p className="text-xs text-earth-muted mt-0.5">/ property / month</p>
              </div>
              <div className="w-px bg-earth-border" />
              <div>
                <p className="text-2xl font-serif text-earth-dark">5 min</p>
                <p className="text-xs text-earth-muted mt-0.5">To go live</p>
              </div>
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex justify-center lg:justify-end animate-slide-in-right">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* Platform Bar */}
      <section className="border-y border-earth-border/60 py-8 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          <p className="text-sm text-earth-muted tracking-wide">Works with your guests&apos; favorite platforms</p>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.129-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="text-sm font-medium text-earth-dark">WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#2AABEE"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.129-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              <span className="text-sm font-medium text-earth-dark">Telegram</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-earth-muted" />
              <span className="text-sm font-medium text-earth-dark">SMS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats + Logo Strip */}
      <section className="py-10 px-6 lg:px-8 border-b border-earth-border/60">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
          {/* Stats row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20">
            {SOCIAL_PROOF_STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-serif text-earth-dark">{stat.value}</p>
                <p className="text-xs text-earth-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
          {/* Platform logo strip */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <p className="text-xs text-earth-light tracking-wide">Trusted by hosts listing on</p>
            <div className="flex items-center gap-5">
              <span className="text-sm font-semibold text-[#FF5A5F]">Airbnb</span>
              <span className="text-earth-border text-xs">·</span>
              <span className="text-sm font-semibold text-[#003580]">Booking.com</span>
              <span className="text-earth-border text-xs">·</span>
              <span className="text-sm font-semibold text-[#1C5CF3]">VRBO</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Recognition Section */}
      <section className="py-24 px-6 lg:px-8 bg-grove-subtle/40">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: the messages */}
            <div className="reveal space-y-3">
              {[
                { msg: 'Hi! What\'s the WiFi password? 😅', time: '7:43', side: 'guest' },
                { msg: 'What time is check-in exactly?', time: '11:12', side: 'guest' },
                { msg: 'Is there parking nearby? How much does it cost?', time: '14:28', side: 'guest' },
                { msg: 'Can you recommend any good restaurants nearby? 🍽️', time: '18:42', side: 'guest' },
                { msg: 'Sorry to bother you — the key code isn\'t working 😬', time: '23:47', side: 'guest' },
              ].map((item, i) => (
                <div key={i} className="flex justify-start">
                  <div className="bg-white border border-earth-border rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] shadow-saas-sm">
                    <p className="text-sm text-earth-dark">{item.msg}</p>
                    <p className="text-[10px] text-earth-light text-right mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Right: copy */}
            <div className="reveal">
              <p className="text-sm font-semibold text-grove tracking-widest uppercase mb-5">Sound familiar?</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-earth-dark leading-tight mb-6">
                You answered all of this.<br />Yesterday. And the day before.
              </h2>
              <p className="text-earth-muted text-base leading-relaxed mb-6">
                The average property manager gets <strong className="text-earth-dark font-medium">40 to 60 guest messages a week.</strong> Most of them are the same five questions. That is a lot of time to spend on things that could run themselves.
              </p>
              <p className="text-earth-muted text-base leading-relaxed">
                HeyConcierge takes care of all of it. Instantly, in the guest&apos;s own language, any time of day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-20">
            <p className="text-sm font-medium text-grove tracking-wide mb-4 reveal">Benefits</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-earth-dark/40 leading-tight mb-4 reveal max-w-2xl">
              Stop answering the same questions. Every. Single. Day.
            </h2>
            <p className="text-base text-earth-muted max-w-xl reveal">
              WiFi password, check-in time, where to park. HeyConcierge handles all of it, in the guest&apos;s own language, so you can focus on growing your portfolio instead of your inbox.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {features.slice(0, 4).map((f, i) => (
              <div key={i} className="reveal">
                <div className="border-t border-earth-border pt-6">
                  <f.icon className="text-earth-muted mb-4" size={22} strokeWidth={1.5} />
                  <h3 className="text-base font-medium text-earth-dark mb-2">{f.title}</h3>
                  <p className="text-sm text-earth-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gap Section — objection: "I already have messaging built in" */}
      <section className="py-28 px-6 lg:px-8 bg-grove-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-sm font-medium text-grove tracking-wide mb-4 reveal">What your current setup misses</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-earth-dark leading-tight mb-4 reveal max-w-2xl">
              Your booking platform handles bookings.<br />HeyConcierge handles everything after.
            </h2>
            <p className="text-base text-earth-muted max-w-xl reveal">
              Most chat tools live inside your booking platform. Your guests don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            {[
              {
                title: 'Guests leave the platform',
                body: 'Once they arrive, guests text on WhatsApp or just knock. HeyConcierge meets them there — not inside a booking app they stopped checking.',
              },
              {
                title: 'Questions come at 2am',
                body: "The key code doesn't work. The WiFi dropped. You're asleep. HeyConcierge answers instantly, without waking you up.",
              },
              {
                title: 'Not everyone speaks English',
                body: 'Guests might text in German, French, or Japanese. HeyConcierge replies in their language automatically — no effort on your end.',
              },
              {
                title: 'Context your booking tool will never have',
                body: 'The quiet parking spot two streets over. When the bins go out. The neighbour to avoid. These details live in HeyConcierge.',
              },
            ].map((item, i) => (
              <div key={i} className="reveal border-t border-earth-border pt-6">
                <h3 className="text-base font-medium text-earth-dark mb-2">{item.title}</h3>
                <p className="text-sm text-earth-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Expert Section */}
      <section className="py-28 px-6 lg:px-8 bg-earth-dark text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="reveal">
              <p className="text-xs font-semibold tracking-widest text-grove-lighter uppercase mb-5">Your knowledge. Their experience.</p>
              <h2 className="font-serif text-4xl sm:text-5xl text-white leading-tight mb-6">
                Not a generic AI.<br />Your personal<br />local insider.
              </h2>
              <p className="text-white/60 text-base leading-relaxed mb-8">
                You know things Google doesn&apos;t. The tiny trattoria three blocks away with the best pasta in the city. The beach that is empty on Tuesday mornings. The wine bar that only locals go to.
              </p>
              <p className="text-white/60 text-base leading-relaxed">
                You tell HeyConcierge all of it. Your guests get <em className="text-white not-italic font-medium">your</em> knowledge, delivered over WhatsApp in seconds. Like getting a text from a local friend who knows the city inside out.
              </p>
            </div>
            {/* Right — knowledge pills */}
            <div className="reveal space-y-3">
              {[
                { label: 'WiFi & check-in', example: '"The keybox code is 4821. Blue door on the left, you can\'t miss it."' },
                { label: 'House rules', example: '"No shoes inside please. Washing machine is in the hallway, feel free to use it."' },
                { label: 'Hidden gems', example: '"Skip the main square. Go to Trattoria da Marco, 5 min walk, ask for the daily special. Thank me later."' },
                { label: 'Local secrets', example: '"There\'s a Tuesday market on Via Roma that only locals know. Best produce in the city by far."' },
                { label: 'Practical tips', example: '"Parking is free after 8pm on the side streets. Friday afternoons are chaos on the main road, plan around it."' },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 reveal">
                  <p className="text-[10px] font-semibold text-grove-lighter uppercase tracking-widest mb-2">{item.label}</p>
                  <p className="text-white/70 text-sm italic leading-relaxed">{item.example}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GetYourGuide Upselling Section */}
      <section className="py-28 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — WhatsApp conversation mockup */}
            <div className="reveal">
              <div className="bg-[#ECE5DD] rounded-2xl p-5 max-w-sm mx-auto lg:mx-0 shadow-saas-lg">
                <div className="space-y-3">
                  {/* Guest message */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] shadow-sm">
                      <p className="text-sm text-gray-800">Hey! Any good activities nearby? We have a free day tomorrow 😊</p>
                      <p className="text-[10px] text-gray-400 text-right mt-1">10:14</p>
                    </div>
                  </div>
                  {/* AI reply */}
                  <div className="flex justify-end">
                    <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-3 py-3 max-w-[88%] shadow-sm">
                      <p className="text-sm text-gray-800 mb-2.5">Great choice! Here are the best experiences:</p>
                      <div className="space-y-2">
                        {[
                          { name: 'Kayak tour of the old harbour', desc: '2h · Small group · ★ 4.9', price: 'From €35' },
                          { name: 'Local food & wine walking tour', desc: '3h · Guide included · ★ 4.8', price: 'From €49' },
                        ].map((item, i) => (
                          <div key={i} className="bg-white rounded-xl px-3 py-2.5">
                            <p className="text-xs font-semibold text-gray-800 leading-tight">{item.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                            <p className="text-[10px] font-semibold text-[#25D366] mt-1">{item.price}</p>
                            <div className="mt-1.5 bg-[#25D366] rounded-lg px-2 py-1 text-center">
                              <p className="text-[10px] font-semibold text-white">Book Now →</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 text-right mt-2">10:14 ✓✓</p>
                    </div>
                  </div>
                  {/* Guest reply */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[70%] shadow-sm">
                      <p className="text-sm text-gray-800">The food tour looks perfect! Booking now 🙌</p>
                      <p className="text-[10px] text-gray-400 text-right mt-1">10:16</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right — copy */}
            <div className="reveal">
              <p className="text-xs font-semibold tracking-widest text-grove uppercase mb-5">Earn while you sleep</p>
              <h2 className="font-serif text-4xl sm:text-5xl text-earth-dark leading-tight mb-6">
                Every &ldquo;what should<br />I do today?&rdquo; is<br />a revenue opportunity.
              </h2>
              <p className="text-earth-muted text-base leading-relaxed mb-6">
                When a guest asks what to do, HeyConcierge recommends local experiences from <strong className="text-earth-dark font-medium">GetYourGuide</strong>. When the guest pays and completes the booking, you earn a commission. No invoices, no follow-up, nothing.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Recommends tours and experiences based on your location',
                  'Guests book directly from the WhatsApp conversation',
                  'Commission lands automatically on every completed booking',
                  'You do nothing. It just works.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-earth-muted">
                    <span className="w-5 h-5 rounded-full bg-grove-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="text-grove"><polyline points="2 6 5 9 10 3"/></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-grove hover:bg-grove-dark text-white px-7 py-3.5 rounded-full font-medium text-sm no-underline transition-all hover:-translate-y-0.5"
              >
                Start earning commission <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Property Image Gallery */}
      <section className="px-6 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 reveal">
            <p className="text-sm font-medium text-grove tracking-wide mb-3">Built for properties like yours</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-earth-dark/40 leading-tight">
              From city apartments to countryside villas.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[460px]">
            <div className="md:col-span-2 rounded-2xl overflow-hidden relative group h-full">
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
                alt="Luxury vacation rental bedroom"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/25 flex items-end p-8">
                <p className="font-serif text-2xl sm:text-3xl text-white italic">&ldquo;Your Airbnb on autopilot.&rdquo;</p>
              </div>
            </div>
            <div className="grid grid-rows-2 gap-6 h-full">
              <div className="rounded-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80"
                  alt="Cozy cabin living room"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="rounded-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=600&q=80"
                  alt="Property exterior"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ambient Break */}
      <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80"
          alt="Luxury vacation rental"
        />
        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-black/35" />
        {/* Centered text */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <p className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white text-center italic max-w-3xl leading-tight">
            &ldquo;Happy guests leave 5-star reviews.&rdquo;
          </p>
        </div>
      </section>

      {/* How It Works — Specifications style */}
      <section id="how" className="py-28 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left */}
            <div>
              <div className="border-t border-earth-border pt-6">
                <p className="text-sm font-medium text-grove tracking-wide mb-4 reveal">How-to</p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-earth-dark/40 leading-tight mb-4 reveal">
                  Three steps.<br />Five minutes.<br />Done.
                </h2>
                <p className="text-base text-earth-muted mb-8 reveal">
                  No developers, no complex integrations. Just a simple dashboard and a QR code.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 text-sm font-medium text-grove border border-grove/30 hover:bg-grove hover:text-white px-6 py-3 rounded-full no-underline transition-all reveal"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Right — Steps */}
            <div className="space-y-0">
              {steps.map((s, i) => (
                <div key={i} className="border-t border-earth-border py-8 reveal">
                  <div className="flex gap-6">
                    <span className="text-sm font-medium text-earth-light">{s.num}</span>
                    <div>
                      <h3 className="text-base font-medium text-earth-dark mb-2">{s.title}</h3>
                      <p className="text-sm text-earth-muted leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 px-6 lg:px-8 bg-grove-subtle/40">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-sm font-medium text-grove tracking-wide mb-4 reveal">What managers say</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-earth-dark leading-tight reveal max-w-xl">
              Don&apos;t take our word for it.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              // PLACEHOLDER: replace with real testimonial
              <div key={i} className="bg-white border border-earth-border rounded-2xl p-6 reveal flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} size={13} className="fill-grove text-grove" />
                  ))}
                </div>
                <p className="text-sm text-earth-text leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-earth-border">
                  <div className="w-9 h-9 rounded-full bg-grove-subtle flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-grove">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-earth-dark">{t.name}</p>
                    <p className="text-xs text-earth-muted">{t.location} · {t.properties} properties</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 px-6 lg:px-8 bg-grove-subtle/50">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16">
            <p className="text-sm font-medium text-grove tracking-wide mb-4 reveal">FAQ</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-earth-dark/40 leading-tight reveal">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <div key={i} className="border-t border-earth-border reveal">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-6 text-left bg-transparent border-0 cursor-pointer"
                >
                  <span className="text-sm font-medium text-earth-dark pr-4">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-earth-light flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <p className="text-sm text-earth-muted leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlight Quote — PLACEHOLDER: replace with a real verified quote */}
      <section className="py-20 px-6 lg:px-8 bg-earth-dark">
        <div className="max-w-2xl mx-auto text-center reveal">
          <p className="font-serif text-2xl sm:text-3xl text-white italic leading-snug mb-5">
            &ldquo;{HIGHLIGHT_QUOTE.text}&rdquo;
          </p>
          <p className="text-sm text-white/40 tracking-wide">{HIGHLIGHT_QUOTE.attribution}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-earth-dark leading-tight mb-6 reveal">
            Ready to take your properties<br />to the next level?
          </h2>
          <p className="text-base text-earth-muted mb-10 reveal">
            Give every guest a 5-star experience — automatically. 30-day free trial, set up in 5 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-grove hover:bg-grove-dark text-white w-full max-w-md py-4 rounded-full font-medium text-sm no-underline transition-all reveal"
          >
            Start Free Trial <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-earth-light mt-4 reveal">
            <GeoPrice variant="inline" /> &nbsp;·&nbsp; No lock-in &nbsp;·&nbsp;{' '}
            <Link href="/pricing" className="text-grove hover:underline">See full pricing</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-earth-border py-16 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            {/* Nav links */}
            <div>
              <ul className="space-y-3 list-none p-0">
                <li><a href="#features" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">Features</a></li>
                <li><a href="#how" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">How-to</a></li>
                <li><Link href="/faq" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">FAQ</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <ul className="space-y-3 list-none p-0">
                <li><a href="mailto:hello@heyconcierge.io" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">Contact</a></li>
                <li><Link href="/login" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">Sign In</Link></li>
                <li><Link href="/signup" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">Sign Up</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <ul className="space-y-3 list-none p-0">
                <li><a href="/legal/privacy" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">Privacy Policy</a></li>
                <li><a href="/legal/terms" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">Terms of Service</a></li>
                <li><a href="/legal/dpa" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">DPA</a></li>
                <li><a href="/legal/cookies" className="text-sm text-earth-muted hover:text-earth-dark transition-colors no-underline">Cookie Policy</a></li>
                <li><CookieSettingsLink className="text-sm text-earth-muted hover:text-earth-dark transition-colors cursor-pointer bg-transparent border-0 p-0 font-[inherit]" /></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-earth-border">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="#4A5D23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" />
                <path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" />
                <rect x="5" y="17" width="22" height="4" rx="1.5" />
              </svg>
              <span className="text-sm font-medium text-earth-dark">HeyConcierge</span>
            </div>
            <p className="text-xs text-earth-light">
              &copy; {new Date().getFullYear()} HeyConcierge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <PWAInstallPrompt />
      <ChatWidget />
    </div>
  )
}
