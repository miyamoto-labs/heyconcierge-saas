'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import MascotSVG from '@/components/brand/MascotSVG'
import CookieSettingsLink from '@/components/ui/CookieSettingsLink'
import LogoSVG from '@/components/brand/LogoSVG'
import { createClient } from '@/lib/supabase/client'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import ChatWidget from '@/components/chat/UltraSimpleWidget'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      const nav = document.querySelector('nav')
      if (nav) {
        if (window.scrollY > 50) nav.classList.add('scrolled')
        else nav.classList.remove('scrolled')
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <>
      {/* Floating Background Shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
        
        {/* Animated Stars */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="particle"
            style={{
              width: `${10 + Math.random() * 20}px`,
              height: `${10 + Math.random() * 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-4 backdrop-blur-[20px] bg-[rgba(255,248,240,0.85)] border-b border-[rgba(108,92,231,0.08)] transition-all duration-300">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-nunito text-[1.6rem] font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-9 h-9 animate-bounce-slow" />
            <span className="text-accent">Hey</span>
            <span className="text-dark">Concierge</span>
          </Link>
          
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8 list-none">
            <li><a href="#features" className="no-underline text-muted font-semibold text-[0.95rem] hover:text-primary transition-colors">Features</a></li>
            <li><a href="#how" className="no-underline text-muted font-semibold text-[0.95rem] hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#pricing" className="no-underline text-muted font-semibold text-[0.95rem] hover:text-primary transition-colors">Pricing</a></li>
            <li><Link href="/faq" className="no-underline text-muted font-semibold text-[0.95rem] hover:text-primary transition-colors">FAQ</Link></li>
            {isLoggedIn && userEmail && (
              <li className="text-muted font-semibold text-[0.95rem]">
                {userEmail}
              </li>
            )}
            <li>
              {isLoggedIn ? (
                <Link href="/dashboard" className="no-underline bg-primary text-white px-6 py-2.5 rounded-full font-bold text-[0.95rem] transition-all hover:bg-dark hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)] hover:shadow-[0_6px_20px_rgba(45,43,85,0.3)]">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="no-underline bg-primary text-white px-6 py-2.5 rounded-full font-bold text-[0.95rem] transition-all hover:bg-dark hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)] hover:shadow-[0_6px_20px_rgba(45,43,85,0.3)]">
                  Start Here
                </Link>
              )}
            </li>
          </ul>

          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 w-8 h-8 justify-center items-center transition-all hover:scale-110"
            aria-label="Toggle menu"
          >
            <span className={`block w-7 h-0.5 bg-dark transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-7 h-0.5 bg-dark transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-7 h-0.5 bg-dark transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden fixed top-[72px] left-0 right-0 bg-[rgba(255,248,240,0.98)] backdrop-blur-[20px] border-b border-[rgba(108,92,231,0.08)] transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <ul className="flex flex-col gap-2 px-8 py-6 list-none">
            <li><a href="#features" onClick={() => setMobileMenuOpen(false)} className="block no-underline text-muted font-semibold text-base py-3 hover:text-primary transition-colors">Features</a></li>
            <li><a href="#how" onClick={() => setMobileMenuOpen(false)} className="block no-underline text-muted font-semibold text-base py-3 hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block no-underline text-muted font-semibold text-base py-3 hover:text-primary transition-colors">Pricing</a></li>
            <li><Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block no-underline text-muted font-semibold text-base py-3 hover:text-primary transition-colors">FAQ</Link></li>
            {isLoggedIn && userEmail && (
              <li className="text-muted font-semibold text-base py-2 border-t border-[rgba(108,92,231,0.1)] mt-2 pt-4">
                {userEmail}
              </li>
            )}
            <li className="mt-4">
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-center no-underline bg-primary text-white px-6 py-3 rounded-full font-bold text-base transition-all hover:bg-dark shadow-[0_4px_15px_rgba(108,92,231,0.3)]">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center no-underline bg-primary text-white px-6 py-3 rounded-full font-bold text-base transition-all hover:bg-dark shadow-[0_4px_15px_rgba(108,92,231,0.3)]">
                  Start Here
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-[1] min-h-screen flex items-center pt-32 pb-16 px-8 overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 items-center w-full">
          <div className="animate-slide-up md:text-left text-center">
            <div className="inline-flex items-center gap-2 bg-[rgba(108,92,231,0.15)] border border-[rgba(108,92,231,0.2)] px-4 py-1.5 rounded-full text-[0.85rem] font-semibold text-primary mb-6 hover:bg-[rgba(108,92,231,0.2)] transition-all duration-300 cursor-default shadow-sm hover:shadow-md hover:scale-105" style={{animation: 'glowPulse 4s ease-in-out infinite'}}>
              <span className="w-2 h-2 bg-mint rounded-full animate-pulse-dot shadow-[0_0_8px_rgba(85,239,196,0.8)]" />
              Now Live — Try it Free
            </div>
            <h1 className="font-nunito text-[3.8rem] max-md:text-[2.5rem] font-black leading-[1.1] mb-5 tracking-tight">
              Your guests&apos;<br />
              <span className="text-accent">favorite</span> new<br />
              <span className="text-primary">friend.</span>
            </h1>
            <p className="text-[1.2rem] text-muted mb-8 max-w-[480px] leading-[1.7] md:mx-0 mx-auto">
              A happy little AI concierge that chats with your guests. Answers questions instantly, speaks every language, and knows your property inside out.
            </p>
            <div className="flex gap-3 flex-wrap mb-10 md:justify-start justify-center">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.85rem] font-bold bg-accent-soft text-accent hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-default shadow-sm hover:shadow-md">🤖 AI-Powered</span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.85rem] font-bold bg-[#E8F8F0] text-mint-dark hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-default shadow-sm hover:shadow-md">💬 Telegram · WhatsApp · SMS</span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.85rem] font-bold bg-[#E8E4FF] text-primary hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-default shadow-sm hover:shadow-md">🌍 Multilingual</span>
            </div>
            <div className="flex gap-4 items-center md:justify-start justify-center flex-wrap">
              <Link 
                href="/signup" 
                className="group/btn relative inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-nunito text-[1.05rem] font-extrabold no-underline transition-all shadow-[0_6px_25px_rgba(108,92,231,0.35)] hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(108,92,231,0.5)] hover:scale-105"
                style={{animation: 'glowPulse 3s ease-in-out infinite'}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:rotate-12 transition-transform duration-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="group-hover/btn:scale-110 inline-block transition-transform duration-300">Get Started Free</span>
              </Link>
              <a 
                href="#how" 
                className="group/btn2 inline-flex items-center gap-2 bg-transparent text-dark px-7 py-4 rounded-full font-nunito text-base font-bold no-underline border-2 border-[rgba(45,43,85,0.1)] transition-all hover:border-primary hover:text-primary hover:-translate-y-2 hover:bg-[rgba(108,92,231,0.05)] hover:scale-105"
              >
                <span className="group-hover/btn2:scale-110 inline-block transition-transform duration-300">See How It Works</span>
                <span className="group-hover/btn2:translate-y-1 inline-block transition-transform duration-300">↓</span>
              </a>
            </div>
          </div>

          {/* Hero Mascot */}
          <div className="relative flex items-center justify-center animate-slide-up-delay md:order-none order-first group">
            <div className="relative w-[380px] h-[380px] max-md:w-[250px] max-md:h-[250px]">
              {/* Animated glow rings */}
              <div className="absolute -inset-5 bg-[radial-gradient(circle,rgba(108,92,231,0.25),transparent_65%)] rounded-full animate-float-slow blur-xl group-hover:bg-[radial-gradient(circle,rgba(108,92,231,0.4),transparent_65%)] transition-all duration-500" />
              <div className="absolute -inset-3 bg-[radial-gradient(circle,rgba(253,121,168,0.15),transparent_70%)] rounded-full animate-float-slow blur-2xl group-hover:bg-[radial-gradient(circle,rgba(253,121,168,0.25),transparent_70%)] transition-all duration-500" style={{animationDelay: '-5s'}} />
              <div className="absolute -inset-8 rounded-full border-2 border-[rgba(108,92,231,0.1)] opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" />
              
              {/* Mascot with hover effects */}
              <div 
                className="relative w-full h-full hover:scale-110 transition-all duration-500 cursor-pointer" 
                style={{animation: 'floatRotate 6s ease-in-out infinite'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.animation = 'floatRotate 1s ease-in-out infinite';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animation = 'floatRotate 6s ease-in-out infinite';
                }}
              >
                <MascotSVG className="relative w-full h-full z-[2] drop-shadow-[0_15px_40px_rgba(108,92,231,0.25)] group-hover:drop-shadow-[0_20px_60px_rgba(108,92,231,0.5)] transition-all duration-500" />
              </div>
              <div className="absolute w-3 h-3 rounded-full bg-yellow top-[10%] left-[10%] animate-sparkle shadow-[0_0_10px_rgba(255,213,0,0.6)]" />
              <div className="absolute w-3 h-3 rounded-full bg-pink top-[5%] right-[20%] animate-sparkle-1 shadow-[0_0_10px_rgba(253,121,168,0.6)]" />
              <div className="absolute w-3 h-3 rounded-full bg-mint bottom-[15%] right-[5%] animate-sparkle-2 shadow-[0_0_10px_rgba(85,239,196,0.6)]" />
              <div className="absolute w-3 h-3 rounded-full bg-blue bottom-[30%] left-[5%] animate-sparkle-3 shadow-[0_0_10px_rgba(108,92,231,0.6)]" />
              <div className="absolute w-2 h-2 rounded-full bg-yellow top-[60%] left-[15%] animate-sparkle shadow-[0_0_8px_rgba(255,213,0,0.5)]" style={{animationDelay: '-1.5s'}} />
              <div className="absolute w-2 h-2 rounded-full bg-pink top-[70%] right-[15%] animate-sparkle-1 shadow-[0_0_8px_rgba(253,121,168,0.5)]" style={{animationDelay: '-0.8s'}} />
              {/* Chat bubbles */}
              <div className="absolute top-[20%] -right-[30px] bg-white rounded-[20px_20px_20px_4px] px-5 py-3 shadow-card text-[0.85rem] font-semibold text-dark z-[3] animate-pop-in-1 bubble-tail-left">
                What&apos;s the WiFi? 📶
              </div>
              <div className="absolute bottom-[25%] -left-[60px] bg-primary text-white rounded-[20px_20px_4px_20px] px-5 py-3 shadow-card text-[0.85rem] font-semibold z-[3] animate-pop-in-2 bubble-tail-right">
                AuroraHaven_Guest ✨
              </div>
              <div className="absolute top-[5%] -left-[20px] bg-white rounded-[20px_20px_20px_4px] px-5 py-3 shadow-card text-[0.8rem] font-semibold text-dark z-[3] animate-pop-in-3 bubble-tail-left-sm">
                🇯🇵 日本語もOK!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="relative z-[1] py-24 px-8 bg-bg-alt">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.85rem] font-bold bg-accent-soft text-accent mb-4">😤 The Problem</span>
          <h2 className="font-nunito text-[2.6rem] max-md:text-[2rem] font-black leading-[1.15] mb-4 reveal">Guests deserve better.</h2>
          <p className="text-[1.1rem] text-muted max-w-[600px] mb-12 reveal">Hospitality hasn&apos;t kept up. Guests wait hours for simple answers while hosts drown in repetitive messages.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '⏰', bg: 'bg-accent-soft', title: '2 AM Questions', desc: "WiFi password? Checkout time? Guests don't wait for office hours. They want answers now." },
              { icon: '🌐', bg: 'bg-[#E8F0FF]', title: 'Lost in Translation', desc: '74% of businesses lose customers without multilingual support.' },
              { icon: '💸', bg: 'bg-[#E8F8F0]', title: 'Expensive Humans', desc: "24/7 multilingual staff costs €40-60K/year. Small hosts and boutique hotels can't afford it." },
              { icon: '🔁', bg: 'bg-[#E8E4FF]', title: 'Same 20 Questions', desc: '80% of guest inquiries repeat. WiFi, taxi, restaurants — on loop forever.' },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-[20px] p-8 shadow-card flex gap-5 transition-all hover:-translate-y-1 hover:shadow-card-hover reveal">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${p.bg}`}>{p.icon}</div>
                <div>
                  <h3 className="font-nunito text-[1.15rem] font-extrabold mb-1">{p.title}</h3>
                  <p className="text-[0.9rem] text-muted leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-dark rounded-full px-8 py-4 text-center text-yellow font-bold text-[0.95rem] reveal">
            88% of guests say experience matters as much as the room itself 💡
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="relative z-[1] py-24 px-8 bg-bg">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.85rem] font-bold bg-[#E8E4FF] text-primary mb-4">✨ The Solution</span>
          <h2 className="font-nunito text-[2.6rem] max-md:text-[2rem] font-black leading-[1.15] mb-4 reveal">Meet HeyConcierge!</h2>
          <p className="text-[1.1rem] text-muted max-w-[600px] mb-12 reveal">A friendly AI that chats with your guests on Telegram, WhatsApp, or SMS. No app downloads. No fuss.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-4">
              {[
                { icon: '💬', bg: 'bg-[#E8F8F0]', title: 'Multi-Channel', desc: 'Telegram, WhatsApp, or SMS. Guests just text. No downloads, no friction.' },
                { icon: '🧠', bg: 'bg-[#E8E4FF]', title: 'Claude AI Brain', desc: 'Smart, safe, nuanced responses — powered by Anthropic.' },
                { icon: '🌍', bg: 'bg-[#E8F0FF]', title: 'Auto-Multilingual', desc: 'Japanese guest? Japanese reply. Instantly. 50+ languages.' },
                { icon: '⚙️', bg: 'bg-[#FFF5E8]', title: 'Simple Dashboard', desc: 'Add properties, sync calendars, configure AI. That\'s it.' },
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-[20px] px-7 py-5 shadow-card flex items-center gap-5 transition-all feature-card-hover hover:shadow-card-hover reveal">
                  <div className={`w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-[1.4rem] flex-shrink-0 ${f.bg}`}>{f.icon}</div>
                  <div>
                    <h4 className="font-nunito text-base font-extrabold mb-0.5">{f.title}</h4>
                    <p className="text-[0.85rem] text-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative flex items-center justify-center reveal">
              <div className="relative w-[300px] h-[300px]">
                <div className="absolute -inset-5 bg-[radial-gradient(circle,rgba(108,92,231,0.15),transparent_65%)] rounded-full animate-float-slow" />
                <MascotSVG className="relative w-full h-full z-[2] drop-shadow-[0_10px_30px_rgba(108,92,231,0.2)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="relative z-[1] py-24 px-8 bg-bg-alt">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.85rem] font-bold bg-[#E8F8F0] text-mint-dark mb-4">🛠 How It Works</span>
          <h2 className="font-nunito text-[2.6rem] max-md:text-[2rem] font-black leading-[1.15] mb-4 reveal">Three steps. Five minutes. Done!</h2>
          <p className="text-[1.1rem] text-muted max-w-[600px] mb-12 reveal">No developers, no integrations, no PMS required. Just a simple dashboard and a QR code.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { num: '1', bg: 'bg-primary', emoji: '📝', title: 'Add Your Property', desc: 'Property details, WiFi password, local tips, house rules — all in a simple dashboard.', arrow: true },
              { num: '2', bg: 'bg-accent', emoji: '📱', title: 'Share the Number', desc: 'QR code in the room, on the welcome card, or in the booking confirmation.', arrow: true },
              { num: '3', bg: 'bg-mint-dark', emoji: '⚡', title: 'Guests Chat, AI Answers', desc: 'Guests message in any language. HeyConcierge replies instantly, 24/7, like a local friend.', arrow: false },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-3xl px-8 py-10 text-center shadow-card transition-all hover:-translate-y-1.5 hover:shadow-card-hover relative reveal">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-nunito text-2xl font-black text-white mx-auto mb-5 ${s.bg}`}>{s.num}</div>
                <div className="text-[2.2rem] mb-4">{s.emoji}</div>
                <h3 className="font-nunito text-[1.2rem] font-extrabold mb-2">{s.title}</h3>
                <p className="text-[0.9rem] text-muted leading-relaxed">{s.desc}</p>
                {s.arrow && <span className="absolute top-1/2 -right-5 -translate-y-1/2 text-2xl text-primary-light z-[2] hidden md:block">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-[1] py-24 px-8 bg-bg">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.85rem] font-bold bg-[#E8F8F0] text-mint-dark mb-4">💰 Pricing</span>
          <h2 className="font-nunito text-[2.6rem] max-md:text-[2rem] font-black leading-[1.15] mb-4 reveal">Simple pricing. Happy customers.</h2>
          <p className="text-[1.1rem] text-muted max-w-[600px] mb-12 reveal">Start small, scale big. No hidden fees, no contracts.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-md:max-w-[400px] max-md:mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-3xl px-8 py-10 text-center shadow-card relative transition-all hover:-translate-y-1.5 hover:shadow-card-hover overflow-hidden reveal">
              <div className="h-1 rounded-sm mb-6 bg-blue" />
              <div className="text-[2rem] mb-2">🌱</div>
              <div className="text-[0.85rem] font-extrabold tracking-[0.15em] uppercase text-blue mb-3">Starter</div>
              <div className="font-nunito text-[3rem] font-black text-dark">€49</div>
              <div className="text-[0.9rem] text-muted mb-6">/month</div>
              <ul className="list-none text-left mb-8 space-y-2">
                {['1 property', '500 messages/mo', 'Basic analytics', 'Email support'].map((f, i) => (
                  <li key={i} className="text-[0.9rem] text-muted flex items-center gap-2"><span className="text-mint-dark font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3.5 rounded-full font-nunito text-[0.95rem] font-extrabold text-center transition-all border-2 border-primary-light text-primary bg-transparent hover:bg-primary hover:text-white hover:border-primary no-underline">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-3xl px-8 py-10 text-center shadow-card relative transition-all hover:-translate-y-1.5 hover:shadow-card-hover overflow-hidden price-featured reveal">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-1 rounded-b-xl text-[0.75rem] font-extrabold tracking-wider">⭐ MOST POPULAR</div>
              <div className="h-1 rounded-sm mb-6 bg-primary" />
              <div className="text-[2rem] mb-2">⚡</div>
              <div className="text-[0.85rem] font-extrabold tracking-[0.15em] uppercase text-primary mb-3">Pro</div>
              <div className="font-nunito text-[3rem] font-black text-dark">€99</div>
              <div className="text-[0.9rem] text-muted mb-6">/month</div>
              <ul className="list-none text-left mb-8 space-y-2">
                {['3 properties', '2,000 messages/mo', 'Advanced analytics', 'Priority support', 'Custom branding'].map((f, i) => (
                  <li key={i} className="text-[0.9rem] text-muted flex items-center gap-2"><span className="text-mint-dark font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3.5 rounded-full font-nunito text-[0.95rem] font-extrabold text-center transition-all border-2 border-primary bg-primary text-white hover:bg-dark hover:border-dark no-underline">Get Started</Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-3xl px-8 py-10 text-center shadow-card relative transition-all hover:-translate-y-1.5 hover:shadow-card-hover overflow-hidden reveal">
              <div className="h-1 rounded-sm mb-6 bg-accent" />
              <div className="text-[2rem] mb-2">👑</div>
              <div className="text-[0.85rem] font-extrabold tracking-[0.15em] uppercase text-accent mb-3">Enterprise</div>
              <div className="font-nunito text-[3rem] font-black text-dark">€249</div>
              <div className="text-[0.9rem] text-muted mb-6">/month</div>
              <ul className="list-none text-left mb-8 space-y-2">
                {['Unlimited properties', 'Unlimited messages', 'API access', 'Dedicated manager', 'White-label'].map((f, i) => (
                  <li key={i} className="text-[0.9rem] text-muted flex items-center gap-2"><span className="text-mint-dark font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3.5 rounded-full font-nunito text-[0.95rem] font-extrabold text-center transition-all border-2 border-primary-light text-primary bg-transparent hover:bg-primary hover:text-white hover:border-primary no-underline">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dark text-center py-20 px-8 relative overflow-hidden cta-glow">
        <div className="max-w-[1100px] mx-auto relative">
          <h2 className="font-nunito text-[2.8rem] max-md:text-[2rem] font-black text-white mb-4 reveal">
            Let&apos;s make every guest<br />feel like a VIP. ✨
          </h2>
          <p className="text-[1.1rem] text-text-light mb-8 reveal">Every property deserves a concierge. Every guest deserves an instant answer.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-accent text-white px-10 py-5 rounded-full font-nunito text-[1.15rem] font-extrabold no-underline transition-all shadow-[0_6px_25px_rgba(255,107,107,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(255,107,107,0.5)] reveal">
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark border-t border-[rgba(255,255,255,0.05)] py-8 px-8 text-center text-text-light text-[0.85rem] relative z-[1]">
        <p>Made with 💜 in the Arctic &nbsp;·&nbsp; Tromsø, Norway &nbsp;·&nbsp; <a href="mailto:hello@heyconcierge.io" className="text-primary-light no-underline">hello@heyconcierge.io</a></p>
        <div className="mt-3 flex items-center justify-center gap-4 text-[0.8rem] opacity-60">
          <a href="/legal/privacy" className="text-text-light hover:opacity-100 transition no-underline">Privacy Policy</a>
          <span>·</span>
          <a href="/legal/terms" className="text-text-light hover:opacity-100 transition no-underline">Terms of Service</a>
          <span>·</span>
          <a href="/legal/dpa" className="text-text-light hover:opacity-100 transition no-underline">DPA</a>
          <span>·</span>
          <a href="/legal/cookies" className="text-text-light hover:opacity-100 transition no-underline">Cookie Policy</a>
          <span>·</span>
          <CookieSettingsLink className="text-text-light hover:opacity-100 transition cursor-pointer bg-transparent border-0 p-0 font-[inherit] text-[inherit]" />
        </div>
      </footer>
      <PWAInstallPrompt />
      <ChatWidget />
    </>
  )
}
