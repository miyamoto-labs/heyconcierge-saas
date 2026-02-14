'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import MascotSVG from '@/components/MascotSVG'
import LogoSVG from '@/components/LogoSVG'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookie = parts.pop()?.split(';').shift() || null
    return cookie ? decodeURIComponent(cookie) : null
  }
  return null
}

export default function HomeCruise() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const userId = getCookie('user_id')
    const email = getCookie('user_email')
    setIsLoggedIn(!!userId)
    setUserEmail(email)
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
      <style jsx global>{`
        :root {
          --navy: #001f3f;
          --navy-light: #003d7a;
          --gold: #d4af37;
          --gold-light: #f4d03f;
          --ocean: #006994;
          --ocean-light: #4a9cc1;
          --white-foam: #f8f9fa;
        }
        
        /* Maritime wave animation */
        @keyframes wave {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-25px) translateY(-5px); }
          50% { transform: translateX(0) translateY(0); }
          75% { transform: translateX(25px) translateY(5px); }
        }
        
        @keyframes ship-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(0deg); }
          75% { transform: translateY(-8px) rotate(1deg); }
        }
        
        @keyframes compass-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .wave-bg {
          background: linear-gradient(135deg, var(--navy) 0%, var(--ocean) 50%, var(--ocean-light) 100%);
        }
        
        .ship-float {
          animation: ship-float 6s ease-in-out infinite;
        }
        
        .wave-element {
          animation: wave 8s ease-in-out infinite;
        }
      `}</style>

      {/* Maritime Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden wave-bg">
        {/* Animated waves */}
        <div className="absolute bottom-0 left-0 right-0 h-32 wave-element opacity-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,60 C150,90 350,30 600,60 C850,90 1050,30 1200,60 L1200,120 L0,120 Z" fill="white" opacity="0.1"/>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 wave-element opacity-15" style={{animationDelay: '-2s'}}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,80 C200,100 400,60 600,80 C800,100 1000,60 1200,80 L1200,120 L0,120 Z" fill="white" opacity="0.1"/>
          </svg>
        </div>
        
        {/* Nautical stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold rounded-full"
            style={{
              top: `${Math.random() * 50}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
        
        {/* Compass rose */}
        <div className="absolute top-20 right-20 w-20 h-20 opacity-5">
          <div className="w-full h-full" style={{animation: 'compass-spin 60s linear infinite'}}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="1"/>
              <path d="M50,5 L50,95 M5,50 L95,50" stroke="white" strokeWidth="1"/>
              <path d="M50,10 L45,50 L50,90 L55,50 Z" fill="white" opacity="0.8"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation - Corporate Cruise Style */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-4 backdrop-blur-[20px] bg-[rgba(0,31,63,0.95)] border-b border-[rgba(212,175,55,0.2)] transition-all duration-300">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-nunito text-[1.6rem] font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-9 h-9" style={{filter: 'brightness(0) invert(1)'}} />
            <span className="text-gold">Hey</span>
            <span className="text-white">Concierge</span>
          </Link>
          <ul className="hidden md:flex items-center gap-8 list-none">
            <li><a href="#features" className="no-underline text-white/80 font-semibold text-[0.95rem] hover:text-gold transition-colors">Solutions</a></li>
            <li><a href="#how" className="no-underline text-white/80 font-semibold text-[0.95rem] hover:text-gold transition-colors">Implementation</a></li>
            <li><a href="#pricing" className="no-underline text-white/80 font-semibold text-[0.95rem] hover:text-gold transition-colors">Investment</a></li>
            {isLoggedIn && userEmail && (
              <li className="text-white/80 font-semibold text-[0.95rem]">
                {userEmail}
              </li>
            )}
            <li>
              {isLoggedIn ? (
                <Link href="/dashboard" className="no-underline bg-gold text-navy px-6 py-2.5 rounded-full font-bold text-[0.95rem] transition-all hover:bg-gold-light hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(212,175,55,0.4)]">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="no-underline bg-gold text-navy px-6 py-2.5 rounded-full font-bold text-[0.95rem] transition-all hover:bg-gold-light hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(212,175,55,0.4)]">
                  Request Demo
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero - Cruise Line Edition */}
      <section className="relative z-[1] min-h-screen flex items-center pt-32 pb-16 px-8 overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 items-center w-full">
          <div className="animate-slide-up md:text-left text-center">
            <div className="inline-flex items-center gap-2 bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.3)] px-4 py-1.5 rounded-full text-[0.85rem] font-semibold text-gold mb-6 hover:bg-[rgba(212,175,55,0.25)] transition-all duration-300 cursor-default">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              Trusted by Premium Hospitality Operators
            </div>
            <h1 className="font-nunito text-[3.8rem] max-md:text-[2.5rem] font-black leading-[1.1] mb-5 tracking-tight text-white">
              Enterprise-Grade<br />
              <span className="text-gold">Guest Services</span><br />
              <span className="text-ocean-light">at Sea & Shore.</span>
            </h1>
            <p className="text-[1.2rem] text-white/80 mb-8 max-w-[520px] leading-[1.7] md:mx-0 mx-auto">
              Deliver world-class concierge services across your fleet. AI-powered, multilingual guest support that operates 24/7 across all vessels and properties.
            </p>
            <div className="flex gap-3 flex-wrap mb-10 md:justify-start justify-center">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.85rem] font-bold bg-navy-light text-gold border border-gold/20">⚓ Fleet-Wide Deployment</span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.85rem] font-bold bg-navy-light text-white border border-white/20">🌐 50+ Languages</span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.85rem] font-bold bg-navy-light text-ocean-light border border-ocean-light/20">📊 Enterprise Analytics</span>
            </div>
            <div className="flex gap-4 items-center md:justify-start justify-center flex-wrap">
              <Link 
                href="/signup" 
                className="group/btn relative inline-flex items-center gap-2 bg-gold text-navy px-8 py-4 rounded-full font-nunito text-[1.05rem] font-extrabold no-underline transition-all shadow-[0_6px_25px_rgba(212,175,55,0.4)] hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(212,175,55,0.6)] hover:scale-105"
              >
                <span className="group-hover/btn:scale-110 inline-block transition-transform duration-300">Schedule Consultation</span>
                <span className="group-hover/btn:translate-x-1 inline-block transition-transform duration-300">→</span>
              </Link>
              <a 
                href="#how" 
                className="group/btn2 inline-flex items-center gap-2 bg-transparent text-white px-7 py-4 rounded-full font-nunito text-base font-bold no-underline border-2 border-white/30 transition-all hover:border-gold hover:text-gold hover:-translate-y-2 hover:bg-[rgba(212,175,55,0.1)] hover:scale-105"
              >
                <span className="group-hover/btn2:scale-110 inline-block transition-transform duration-300">View Case Studies</span>
                <span className="group-hover/btn2:translate-y-1 inline-block transition-transform duration-300">↓</span>
              </a>
            </div>
          </div>

          {/* Hero Mascot - Captain Edition */}
          <div className="relative flex items-center justify-center animate-slide-up-delay md:order-none order-first">
            <div className="relative w-[380px] h-[380px] max-md:w-[250px] max-md:h-[250px]">
              {/* NOTE: Mascot needs captain's hat + suit overlay - add via CSS or SVG modification */}
              <div className="absolute -inset-8 bg-[radial-gradient(circle,rgba(212,175,55,0.2),transparent_70%)] rounded-full animate-float-slow blur-2xl" />
              <div className="absolute -inset-5 border-2 border-gold/20 rounded-full" />
              
              {/* Cruise ship illustration */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[200px] ship-float">
                <svg viewBox="0 0 200 100" className="w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                  {/* Ship hull */}
                  <path d="M20,60 L180,60 L170,80 L30,80 Z" fill="#003d7a" stroke="#d4af37" strokeWidth="2"/>
                  {/* Decks */}
                  <rect x="40" y="40" width="120" height="20" fill="#001f3f" stroke="#d4af37" strokeWidth="1.5"/>
                  <rect x="60" y="25" width="80" height="15" fill="#001f3f" stroke="#d4af37" strokeWidth="1.5"/>
                  {/* Smoke stack */}
                  <rect x="90" y="10" width="20" height="15" fill="#d4af37"/>
                  {/* Windows */}
                  {[...Array(10)].map((_, i) => (
                    <rect key={i} x={45 + i * 11} y="45" width="8" height="8" fill="#f4d03f" opacity="0.8"/>
                  ))}
                  {/* Waves under ship */}
                  <path d="M0,85 Q25,80 50,85 T100,85 T150,85 T200,85" stroke="white" strokeWidth="2" fill="none" opacity="0.4"/>
                </svg>
              </div>
              
              <div className="relative w-full h-full hover:scale-105 transition-all duration-500 cursor-pointer" 
                style={{animation: 'floatRotate 6s ease-in-out infinite'}}>
                <MascotSVG className="relative w-full h-full z-[2] drop-shadow-[0_15px_40px_rgba(212,175,55,0.4)]" />
                {/* Captain's hat overlay - add CSS transform to position on mascot head */}
                <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Captain's hat */}
                    <ellipse cx="50" cy="75" rx="40" ry="8" fill="#001f3f"/>
                    <rect x="20" y="35" width="60" height="40" rx="5" fill="#001f3f"/>
                    <rect x="15" y="65" width="70" height="12" rx="3" fill="#d4af37"/>
                    <circle cx="50" cy="50" r="12" fill="#d4af37"/>
                  </svg>
                </div>
              </div>
              
              {/* Nautical sparkles */}
              <div className="absolute w-3 h-3 text-gold top-[15%] right-[10%] animate-sparkle">⚓</div>
              <div className="absolute w-3 h-3 text-gold-light bottom-[20%] left-[5%] animate-sparkle-2">⭐</div>
              
              {/* Corporate message bubbles */}
              <div className="absolute top-[25%] -right-[40px] bg-white rounded-[20px_20px_20px_4px] px-5 py-3 shadow-lg text-[0.85rem] font-semibold text-navy z-[3] animate-pop-in-1">
                Spa reservations? 🧖‍♀️
              </div>
              <div className="absolute bottom-[30%] -left-[50px] bg-gold text-navy rounded-[20px_20px_4px_20px] px-5 py-3 shadow-lg text-[0.85rem] font-semibold z-[3] animate-pop-in-2">
                Deck 7, 2pm ⚓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section - Corporate Tone */}
      <section id="features" className="relative z-[1] py-24 px-8 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.85rem] font-bold bg-navy/10 text-navy mb-4">⚠️ Industry Challenge</span>
          <h2 className="font-nunito text-[2.6rem] max-md:text-[2rem] font-black leading-[1.15] mb-4 reveal text-navy">Guest expectations are rising.<br/>Operations remain manual.</h2>
          <p className="text-[1.1rem] text-gray-600 max-w-[650px] mb-12 reveal">Modern travelers expect instant, personalized service across all touchpoints. Legacy systems and language barriers create friction.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '🌐', title: 'Multilingual Complexity', desc: '50+ nationalities onboard. Staff shortages in language coverage create service gaps and guest dissatisfaction.' },
              { icon: '⏰', title: 'Round-the-Clock Operations', desc: 'Guest services never sleep. Maintaining 24/7 multilingual coverage across fleet requires significant staffing investment.' },
              { icon: '📊', title: 'Fragmented Guest Data', desc: 'Inquiries across email, WhatsApp, reception create operational silos. No unified view of guest journey and preferences.' },
              { icon: '💰', title: 'Rising Labor Costs', desc: 'Multilingual concierge teams represent major OPEX. Traditional scaling requires proportional headcount growth.' },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,31,63,0.1)] border border-navy/5 flex gap-5 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,31,63,0.15)] reveal">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-navy/5">{p.icon}</div>
                <div>
                  <h3 className="font-nunito text-[1.15rem] font-extrabold mb-1 text-navy">{p.title}</h3>
                  <p className="text-[0.9rem] text-gray-600 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-navy rounded-full px-8 py-4 text-center text-gold font-bold text-[0.95rem] reveal">
            92% of cruise passengers cite personalized service as a key satisfaction driver
          </div>
        </div>
      </section>

      {/* Solution - Enterprise Focus */}
      <section id="solution" className="relative z-[1] py-24 px-8 bg-gray-50">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.85rem] font-bold bg-ocean/10 text-ocean mb-4">✨ Enterprise Solution</span>
          <h2 className="font-nunito text-[2.6rem] max-md:text-[2rem] font-black leading-[1.15] mb-4 reveal text-navy">HeyConcierge for Cruise & Hospitality</h2>
          <p className="text-[1.1rem] text-gray-600 max-w-[650px] mb-12 reveal">Scalable AI concierge infrastructure. Deploy once, serve thousands of guests across your entire fleet.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '🚢', title: 'Fleet-Wide Integration', desc: 'Unified platform across all vessels and properties. Consistent guest experience, centralized management, real-time analytics.' },
              { icon: '🤖', title: 'Enterprise AI Engine', desc: 'Anthropic Claude with custom training. Handles complex queries, maintains brand voice, escalates appropriately.' },
              { icon: '🌍', title: 'True Multilingual', desc: 'Not translation — native comprehension in 50+ languages. Guests communicate naturally, AI responds in their language.' },
              { icon: '📱', title: 'Zero-Friction Deployment', desc: 'WhatsApp integration. No app downloads, no guest onboarding. QR codes in cabins, instant activation.' },
              { icon: '📊', title: 'Enterprise Dashboards', desc: 'Real-time analytics, sentiment tracking, common inquiry patterns. Optimize operations with data-driven insights.' },
              { icon: '🔒', title: 'Security & Compliance', desc: 'SOC 2 Type II, GDPR compliant. Enterprise SSO, audit trails, data residency options for regulated markets.' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-[20px] px-7 py-6 shadow-[0_4px_15px_rgba(0,31,63,0.08)] border border-navy/5 flex items-start gap-5 transition-all hover:shadow-[0_6px_25px_rgba(0,31,63,0.12)] hover:-translate-y-1 reveal">
                <div className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-[1.4rem] flex-shrink-0 bg-navy text-gold">{f.icon}</div>
                <div>
                  <h4 className="font-nunito text-base font-extrabold mb-1 text-navy">{f.title}</h4>
                  <p className="text-[0.85rem] text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section id="how" className="relative z-[1] py-24 px-8 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.85rem] font-bold bg-gold/10 text-navy mb-4">🗓 Implementation</span>
          <h2 className="font-nunito text-[2.6rem] max-md:text-[2rem] font-black leading-[1.15] mb-4 reveal text-navy">From contract to deployment:<br/>4 weeks fleet-wide.</h2>
          <p className="text-[1.1rem] text-gray-600 max-w-[650px] mb-12 reveal">Rapid deployment with minimal operational disruption. White-glove onboarding and dedicated success management.</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { week: 'Week 1', title: 'Discovery & Configuration', desc: 'Brand guidelines, service standards, integration requirements. Configure AI knowledge base with fleet specifics.', icon: '📋' },
              { week: 'Week 2', title: 'Pilot Deployment', desc: 'Launch on flagship vessel. Train staff, gather feedback, refine responses and escalation protocols.', icon: '🧪' },
              { week: 'Week 3', title: 'Fleet Rollout', desc: 'Deploy across remaining vessels. Parallel onboarding, centralized monitoring, real-time optimization.', icon: '🚀' },
              { week: 'Week 4', title: 'Optimization & Scale', desc: 'Performance analytics, A/B testing, continuous learning. Dedicated success manager assigned.', icon: '📊' },
            ].map((s, i) => (
              <div key={i} className="bg-gradient-to-br from-navy to-navy-light rounded-3xl px-6 py-8 text-white shadow-[0_8px_25px_rgba(0,31,63,0.15)] transition-all hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,31,63,0.25)] relative reveal">
                <div className="text-[2.5rem] mb-4 opacity-90">{s.icon}</div>
                <div className="text-gold text-[0.75rem] font-extrabold tracking-widest uppercase mb-2">{s.week}</div>
                <h3 className="font-nunito text-[1.1rem] font-extrabold mb-3">{s.title}</h3>
                <p className="text-[0.85rem] text-white/80 leading-relaxed">{s.desc}</p>
                {i < 3 && <div className="absolute top-1/2 -right-3 text-gold text-xl hidden md:block">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment (Pricing) */}
      <section id="pricing" className="relative z-[1] py-24 px-8 bg-gray-50">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.85rem] font-bold bg-gold/10 text-navy mb-4">💼 Investment</span>
          <h2 className="font-nunito text-[2.6rem] max-md:text-[2rem] font-black leading-[1.15] mb-4 reveal text-navy">Flexible enterprise pricing.<br/>Scale with your fleet.</h2>
          <p className="text-[1.1rem] text-gray-600 max-w-[650px] mb-12 reveal">Transparent pricing, predictable costs. Volume discounts for multi-vessel deployments.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Boutique */}
            <div className="bg-white rounded-3xl px-8 py-10 shadow-[0_6px_25px_rgba(0,31,63,0.1)] border-2 border-navy/10 relative transition-all hover:-translate-y-2 hover:shadow-[0_10px_35px_rgba(0,31,63,0.15)] reveal">
              <div className="h-1 rounded-sm mb-6 bg-ocean" />
              <div className="text-[2rem] mb-2">⚓</div>
              <div className="text-[0.85rem] font-extrabold tracking-[0.15em] uppercase text-ocean mb-3">Boutique</div>
              <div className="font-nunito text-[3rem] font-black text-navy">€999</div>
              <div className="text-[0.9rem] text-gray-600 mb-6">/month</div>
              <ul className="list-none text-left mb-8 space-y-3">
                {['1-3 vessels', '10,000 messages/mo', 'Standard analytics', 'Email support', '48h SLA'].map((f, i) => (
                  <li key={i} className="text-[0.9rem] text-gray-700 flex items-center gap-2"><span className="text-gold font-bold text-lg">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3.5 rounded-full font-nunito text-[0.95rem] font-extrabold text-center transition-all border-2 border-ocean text-ocean bg-transparent hover:bg-ocean hover:text-white no-underline">Request Proposal</Link>
            </div>

            {/* Fleet */}
            <div className="bg-white rounded-3xl px-8 py-10 shadow-[0_8px_35px_rgba(0,31,63,0.2)] border-2 border-gold relative transition-all hover:-translate-y-2 hover:shadow-[0_12px_45px_rgba(212,175,55,0.3)] reveal">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-gold text-navy px-5 py-1.5 rounded-b-xl text-[0.75rem] font-extrabold tracking-wider">⭐ RECOMMENDED</div>
              <div className="h-1 rounded-sm mb-6 bg-gold" />
              <div className="text-[2rem] mb-2">🚢</div>
              <div className="text-[0.85rem] font-extrabold tracking-[0.15em] uppercase text-navy mb-3">Fleet</div>
              <div className="font-nunito text-[3rem] font-black text-navy">€2,499</div>
              <div className="text-[0.9rem] text-gray-600 mb-6">/month</div>
              <ul className="list-none text-left mb-8 space-y-3">
                {['4-10 vessels', '50,000 messages/mo', 'Advanced analytics', 'Priority support', 'Dedicated success manager', 'Custom integrations', '24h SLA'].map((f, i) => (
                  <li key={i} className="text-[0.9rem] text-gray-700 flex items-center gap-2"><span className="text-gold font-bold text-lg">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3.5 rounded-full font-nunito text-[0.95rem] font-extrabold text-center transition-all bg-gold text-navy hover:bg-gold-light shadow-[0_4px_15px_rgba(212,175,55,0.3)] no-underline">Request Proposal</Link>
            </div>

            {/* Global */}
            <div className="bg-white rounded-3xl px-8 py-10 shadow-[0_6px_25px_rgba(0,31,63,0.1)] border-2 border-navy/10 relative transition-all hover:-translate-y-2 hover:shadow-[0_10px_35px_rgba(0,31,63,0.15)] reveal">
              <div className="h-1 rounded-sm mb-6 bg-navy" />
              <div className="text-[2rem] mb-2">🌍</div>
              <div className="text-[0.85rem] font-extrabold tracking-[0.15em] uppercase text-navy mb-3">Global</div>
              <div className="font-nunito text-[2.2rem] font-black text-navy">Custom</div>
              <div className="text-[0.9rem] text-gray-600 mb-6">Enterprise pricing</div>
              <ul className="list-none text-left mb-8 space-y-3">
                {['10+ vessels', 'Unlimited messages', 'White-label option', 'API access', 'Custom AI training', 'Multi-region deployment', 'C-level support', '4h SLA'].map((f, i) => (
                  <li key={i} className="text-[0.9rem] text-gray-700 flex items-center gap-2"><span className="text-gold font-bold text-lg">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3.5 rounded-full font-nunito text-[0.95rem] font-extrabold text-center transition-all border-2 border-navy text-navy bg-transparent hover:bg-navy hover:text-white no-underline">Contact Sales</Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 text-[0.95rem]">
              <strong className="text-navy">Volume discounts available.</strong> Multi-year contracts receive preferential rates. ROI calculator available on request.
            </p>
          </div>
        </div>
      </section>

      {/* CTA - Professional */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-ocean text-center py-20 px-8 relative overflow-hidden">
        <div className="max-w-[1100px] mx-auto relative">
          <h2 className="font-nunito text-[2.8rem] max-md:text-[2rem] font-black text-white mb-4 reveal">
            Ready to transform<br />guest services fleet-wide?
          </h2>
          <p className="text-[1.1rem] text-white/80 mb-8 reveal">Schedule a consultation with our enterprise solutions team.</p>
          <Link href="/signup" className="inline-flex items-center gap-3 bg-gold text-navy px-10 py-5 rounded-full font-nunito text-[1.15rem] font-extrabold no-underline transition-all shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_45px_rgba(212,175,55,0.6)] reveal">
            <span>Request Enterprise Demo</span>
            <span className="text-xl">→</span>
          </Link>
          
          <div className="mt-12 flex items-center justify-center gap-12 flex-wrap text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gold text-xl">✓</span>
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gold text-xl">✓</span>
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gold text-xl">✓</span>
              <span>99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Corporate */}
      <footer className="bg-navy border-t border-gold/10 py-8 px-8 text-center text-white/60 text-[0.85rem] relative z-[1]">
        <p>HeyConcierge Enterprise Solutions &nbsp;·&nbsp; Tromsø, Norway &nbsp;·&nbsp; <a href="mailto:enterprise@heyconcierge.io" className="text-gold no-underline hover:text-gold-light">enterprise@heyconcierge.io</a></p>
      </footer>
    </>
  )
}
