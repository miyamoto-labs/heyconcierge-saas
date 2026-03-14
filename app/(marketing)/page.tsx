'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import CookieSettingsLink from '@/components/ui/CookieSettingsLink'
import { createClient } from '@/lib/supabase/client'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import ChatWidget from '@/components/chat/SimpleChatWidget'
import PhoneMockup from '@/components/PhoneMockup'
import {
  MessageSquare,
  Globe,
  Smartphone,
  Building2,
  Star,
  Zap,
  ChevronDown,
  ArrowRight,
  UserPlus,
  QrCode,
  MessagesSquare,
  Menu,
  X,
} from 'lucide-react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      setUserEmail(user?.email || null)
    })
  }, [])

  useEffect(() => {
    const vid = videoRef.current
    if (vid) {
      vid.muted = true
      vid.play().catch(() => {})
    }
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
      const nav = document.querySelector('nav')
      if (nav) {
        if (window.scrollY > 10) nav.classList.add('saas-scrolled')
        else nav.classList.remove('saas-scrolled')
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const features = [
    { icon: MessageSquare, title: '24/7 AI Chat', desc: 'Instant, intelligent responses to guest questions around the clock. No more missed messages or delayed replies.' },
    { icon: Globe, title: '50+ Languages', desc: 'Automatically detects and responds in your guest\'s language. Japanese guest? Japanese reply. Instantly.' },
    { icon: Smartphone, title: 'WhatsApp, Telegram & SMS', desc: 'Meet guests where they already are. No app downloads, no friction — just text.' },
    { icon: Building2, title: 'Property Knowledge', desc: 'Teach the AI about your property — WiFi, rules, local tips — and it answers like a local expert.' },
    { icon: Star, title: 'Guest Satisfaction', desc: 'Faster responses lead to better reviews. Turn every interaction into a 5-star experience.' },
    { icon: Zap, title: '5-Minute Setup', desc: 'No developers, no integrations required. Add your property, share the link, and you\'re live.' },
  ]

  const steps = [
    { num: 1, icon: UserPlus, title: 'Sign Up', desc: 'Create your free account in 30 seconds. No credit card needed.' },
    { num: 2, icon: QrCode, title: 'Add Your Property', desc: 'Tell the AI about your space — WiFi, house rules, local recommendations.' },
    { num: 3, icon: MessagesSquare, title: 'Go Live', desc: 'Share your link or QR code. Guests chat, AI answers — 24/7.' },
  ]

  const faqs = [
    { q: 'What is HeyConcierge?', a: 'HeyConcierge is an AI-powered guest concierge that answers your guests\' questions instantly via WhatsApp, Telegram, or SMS. It knows your property inside out and speaks 50+ languages.' },
    { q: 'How does the AI know about my property?', a: 'You provide property details through a simple dashboard — WiFi password, house rules, local tips, check-in/out times, and more. The AI uses this information to give accurate, personalized answers.' },
    { q: 'Which messaging platforms are supported?', a: 'We currently support WhatsApp, Telegram, and SMS. Your guests simply text a number or scan a QR code — no app downloads needed.' },
    { q: 'Can I try it for free?', a: 'Yes! Sign up and explore the platform at no cost. Our Starter plan is the easiest way to get started with your first property.' },
    { q: 'How long does setup take?', a: 'Most hosts are live within 5 minutes. Just add your property details and share the contact link with your guests. No technical knowledge required.' },
    { q: 'What happens if the AI can\'t answer a question?', a: 'If the AI encounters a question it can\'t handle, it gracefully lets the guest know and can notify you for a personal follow-up.' },
  ]

  return (
    <div className="font-inter bg-[#FDFCFA] text-saas-text">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 lg:px-8 py-4 backdrop-blur-[12px] bg-white/80 border-b border-transparent transition-all duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight no-underline flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" />
                <path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" />
                <rect x="5" y="17" width="22" height="4" rx="1.5" />
              </svg>
            </div>
            <span className="text-saas-dark">Hey<span className="text-primary">Concierge</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-saas-muted hover:text-saas-dark transition-colors no-underline">Features</a>
            <a href="#how" className="text-sm font-medium text-saas-muted hover:text-saas-dark transition-colors no-underline">How It Works</a>
            <Link href="/faq" className="text-sm font-medium text-saas-muted hover:text-saas-dark transition-colors no-underline">FAQ</Link>
            {isLoggedIn && userEmail && (
              <span className="text-sm text-saas-muted">{userEmail}</span>
            )}
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-5 py-2.5 rounded-lg transition-all no-underline shadow-saas-primary hover:shadow-saas-primary-lg hover:-translate-y-0.5">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-5 py-2.5 rounded-lg transition-all no-underline shadow-saas-primary hover:shadow-saas-primary-lg hover:-translate-y-0.5">
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-saas-dark hover:bg-saas-subtle rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-saas-border transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="px-6 py-5 flex flex-col gap-1">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-saas-muted hover:text-saas-dark py-3 no-underline transition-colors">Features</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-saas-muted hover:text-saas-dark py-3 no-underline transition-colors">How It Works</a>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-saas-muted hover:text-saas-dark py-3 no-underline transition-colors">FAQ</Link>
            {isLoggedIn && userEmail && (
              <span className="text-sm text-saas-muted py-2 border-t border-saas-border mt-2 pt-4">{userEmail}</span>
            )}
            <div className="pt-3">
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-center text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-5 py-3 rounded-lg transition-all no-underline">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-5 py-3 rounded-lg transition-all no-underline">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-28 pb-20 px-6 lg:px-8 overflow-hidden">
        {/* Video background — fades in subtly */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
            <source src="/hero-video.mov" type="video/quicktime" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/50" />
        </div>

        {/* Subtle gradient accents */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(108,92,231,0.06),transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(108,92,231,0.04),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left: Copy */}
          <div className="animate-fade-in-up lg:text-left text-center">
            <div className="inline-flex items-center gap-2 bg-primary/[0.08] border border-primary/[0.12] px-4 py-1.5 rounded-full text-xs font-semibold text-primary mb-6">
              <span className="w-1.5 h-1.5 bg-saas-success rounded-full animate-pulse" />
              AI-Powered Guest Communication
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-saas-dark leading-[1.1] tracking-tight mb-6">
              Your guests get instant answers.{' '}
              <span className="text-primary">You get your time back.</span>
            </h1>
            <p className="text-lg italic text-saas-dark/70 mb-6 lg:mx-0 mx-auto">
              {'\u201c'}your Airbnb runs itself, finally.{'\u201d'}
            </p>
            <p className="text-lg text-saas-muted mb-8 max-w-xl leading-relaxed lg:mx-0 mx-auto">
              An AI concierge that chats with your guests 24/7 on WhatsApp, Telegram, or SMS. Speaks every language, knows your property inside out, and never sleeps.
            </p>
            <div className="flex gap-4 items-center lg:justify-start justify-center flex-wrap mb-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-7 py-3.5 rounded-lg font-semibold text-sm no-underline transition-all shadow-saas-primary hover:shadow-saas-primary-lg hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 text-saas-dark px-6 py-3.5 rounded-lg font-semibold text-sm no-underline border border-saas-border hover:border-saas-muted transition-all hover:bg-saas-subtle"
              >
                See How It Works
              </a>
            </div>
            <p className="text-xs text-saas-light lg:text-left text-center">No credit card required</p>
          </div>

          {/* Right: Chat Mockup */}
          <div className="animate-slide-in-right lg:order-none order-first flex justify-center">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* Platform Bar */}
      <section className="border-y border-saas-border/60 bg-saas-bg py-8 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          <p className="text-sm font-medium text-saas-muted">Works with your guests&apos; favorite platforms</p>
          <div className="flex items-center gap-8">
            {/* WhatsApp */}
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="text-sm font-semibold text-saas-dark">WhatsApp</span>
            </div>
            {/* Telegram */}
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#2AABEE"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              <span className="text-sm font-semibold text-saas-dark">Telegram</span>
            </div>
            {/* SMS */}
            <div className="flex items-center gap-2 text-primary">
              <Smartphone size={20} strokeWidth={2.5} />
              <span className="text-sm font-semibold text-saas-dark">SMS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/[0.06] px-4 py-1.5 rounded-full text-xs font-semibold text-primary mb-4">
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-saas-dark tracking-tight mb-4 reveal">
              Everything you need to delight every guest
            </h2>
            <p className="text-lg text-saas-muted max-w-2xl mx-auto reveal">
              From instant answers to multilingual support — HeyConcierge handles guest communication so you can focus on hospitality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white border border-saas-border/60 rounded-xl p-7 transition-all hover:-translate-y-1 hover:shadow-saas-lg hover:border-primary/20 reveal group"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/[0.08] flex items-center justify-center mb-4 group-hover:bg-primary/[0.12] transition-colors">
                  <f.icon className="text-primary" size={20} />
                </div>
                <h3 className="text-base font-bold text-saas-dark mb-2">{f.title}</h3>
                <p className="text-sm text-saas-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 px-6 lg:px-8 bg-saas-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/[0.06] px-4 py-1.5 rounded-full text-xs font-semibold text-primary mb-4">
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-saas-dark tracking-tight mb-4 reveal">
              Three steps. Five minutes. Done.
            </h2>
            <p className="text-lg text-saas-muted max-w-2xl mx-auto reveal">
              No developers, no complex integrations. Just a simple dashboard and a QR code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-[72px] left-[20%] right-[20%] h-[2px] bg-saas-border z-0" />

            {steps.map((s, i) => (
              <div key={i} className="relative z-10 text-center reveal">
                <div className="w-[72px] h-[72px] rounded-2xl bg-white border-2 border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-saas-md">
                  <div className="relative">
                    <s.icon className="text-primary" size={28} />
                    <span className="absolute -top-2 -right-3 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{s.num}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-saas-dark mb-2">{s.title}</h3>
                <p className="text-sm text-saas-muted leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14 reveal">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-7 py-3.5 rounded-lg font-semibold text-sm no-underline transition-all shadow-saas-primary hover:shadow-saas-primary-lg hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-24 px-6 lg:px-8 bg-saas-bg">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/[0.06] px-4 py-1.5 rounded-full text-xs font-semibold text-primary mb-4">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-saas-dark tracking-tight mb-4 reveal">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-saas-border/60 rounded-xl overflow-hidden reveal">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left bg-transparent border-0 cursor-pointer"
                >
                  <span className="text-sm font-semibold text-saas-dark pr-4">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-saas-muted flex-shrink-0 faq-chevron ${openFaq === i ? 'open' : ''}`}
                  />
                </button>
                <div className={`faq-answer ${openFaq === i ? 'open' : ''}`}>
                  <div className="px-6 pb-5">
                    <p className="text-sm text-saas-muted leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 lg:px-8 bg-saas-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(108,92,231,0.15),transparent_70%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 reveal">
            Ready to transform your guest experience?
          </h2>
          <p className="text-lg text-saas-light mb-8 reveal">
            Join hundreds of hosts who save hours every week with AI-powered guest communication.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white hover:bg-saas-bg text-saas-dark px-8 py-4 rounded-lg font-semibold text-sm no-underline transition-all shadow-saas-lg hover:shadow-saas-xl hover:-translate-y-0.5 reveal"
          >
            Get Started Free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-saas-dark border-t border-white/[0.06] py-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" />
                    <path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" />
                    <rect x="5" y="17" width="22" height="4" rx="1.5" />
                  </svg>
                </div>
                <span className="text-white font-bold text-lg">HeyConcierge</span>
              </div>
              <p className="text-sm text-saas-light/70 leading-relaxed max-w-xs">
                AI-powered guest communication for vacation rentals and boutique hotels.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5 list-none p-0">
                <li><a href="#features" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">Features</a></li>
                <li><a href="#how" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">How It Works</a></li>
                <li><Link href="/faq" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">FAQ</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5 list-none p-0">
                <li><a href="mailto:hello@heyconcierge.io" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">Contact</a></li>
                <li><Link href="/login" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">Sign In</Link></li>
                <li><Link href="/signup" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">Sign Up</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5 list-none p-0">
                <li><a href="/legal/privacy" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">Privacy Policy</a></li>
                <li><a href="/legal/terms" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">Terms of Service</a></li>
                <li><a href="/legal/dpa" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">DPA</a></li>
                <li><a href="/legal/cookies" className="text-sm text-saas-light/70 hover:text-white transition-colors no-underline">Cookie Policy</a></li>
                <li><CookieSettingsLink className="text-sm text-saas-light/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 font-[inherit]" /></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-8 text-center">
            <p className="text-xs text-saas-light/50">
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
