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

export default function HomeCorporate() {
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
      {/* Minimal Corporate Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-3xl" />
      </div>

      {/* Navigation - Clean Corporate */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-4 backdrop-blur-md bg-white/90 border-b border-slate-200 transition-all duration-300">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-sans text-[1.4rem] font-bold no-underline flex items-center gap-3">
            <LogoSVG className="w-8 h-8" />
            <span className="text-slate-800">HeyConcierge</span>
          </Link>
          <ul className="hidden md:flex items-center gap-8 list-none">
            <li><a href="#platform" className="no-underline text-slate-600 font-medium text-[0.95rem] hover:text-blue-600 transition-colors">Platform</a></li>
            <li><a href="#benefits" className="no-underline text-slate-600 font-medium text-[0.95rem] hover:text-blue-600 transition-colors">Benefits</a></li>
            <li><a href="#pricing" className="no-underline text-slate-600 font-medium text-[0.95rem] hover:text-blue-600 transition-colors">Pricing</a></li>
            {isLoggedIn && userEmail && (
              <li className="text-slate-600 font-medium text-[0.95rem]">
                {userEmail}
              </li>
            )}
            <li>
              {isLoggedIn ? (
                <Link href="/dashboard" className="no-underline bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-[0.95rem] transition-all hover:bg-blue-700">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="no-underline bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-[0.95rem] transition-all hover:bg-blue-700">
                  Get Started
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero - Professional & Clean */}
      <section className="relative z-[1] min-h-screen flex items-center pt-32 pb-16 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-16 items-center w-full">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full text-[0.85rem] font-semibold text-blue-700 mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/></svg>
              Trusted by Leading Hospitality Brands
            </div>
            <h1 className="font-sans text-[3.5rem] max-md:text-[2.5rem] font-bold leading-[1.1] mb-6 text-slate-900 tracking-tight">
              AI-Powered Guest<br />
              Services for Modern<br />
              <span className="text-blue-600">Hospitality.</span>
            </h1>
            <p className="text-[1.15rem] text-slate-600 mb-8 max-w-[540px] leading-relaxed">
              Deliver exceptional guest experiences with intelligent, multilingual support. Reduce operational costs while improving satisfaction scores.
            </p>
            
            <div className="flex gap-4 items-center flex-wrap mb-12">
              <Link 
                href="/signup" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-7 py-4 rounded-lg font-semibold text-[1rem] no-underline transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              >
                <span>Schedule Demo</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
              <a 
                href="#platform" 
                className="inline-flex items-center gap-2 bg-transparent text-slate-700 px-7 py-4 rounded-lg font-semibold text-[1rem] no-underline border-2 border-slate-300 transition-all hover:border-blue-600 hover:text-blue-600"
              >
                <span>Learn More</span>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span className="font-medium">SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span className="font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span className="font-medium">99.9% Uptime</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Professional */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-[350px] h-[350px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl opacity-40 blur-2xl" />
              <div className="relative bg-white rounded-2xl p-8 shadow-2xl shadow-slate-300/50">
                <MascotSVG className="w-full h-full" />
              </div>
              
              {/* Floating stats cards */}
              <div className="absolute -top-4 -left-6 bg-white rounded-xl p-4 shadow-lg border border-slate-100 animate-float-slow">
                <div className="text-2xl font-bold text-blue-600">94%</div>
                <div className="text-xs text-slate-600">Satisfaction</div>
              </div>
              <div className="absolute -bottom-4 -right-6 bg-white rounded-xl p-4 shadow-lg border border-slate-100 animate-float-slow" style={{animationDelay: '-2s'}}>
                <div className="text-2xl font-bold text-green-600">-40%</div>
                <div className="text-xs text-slate-600">Support Costs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-[1] py-12 px-8 bg-slate-900">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '50+', label: 'Languages Supported' },
            { value: '24/7', label: 'Always Available' },
            { value: '<2s', label: 'Avg Response Time' },
            { value: '10K+', label: 'Daily Conversations' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features */}
      <section id="platform" className="relative z-[1] py-24 px-8 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 mb-4">Platform</span>
            <h2 className="font-sans text-[2.5rem] font-bold mb-4 text-slate-900">Enterprise-Grade Guest Services</h2>
            <p className="text-lg text-slate-600 max-w-[600px] mx-auto">Everything you need to deliver world-class guest experiences at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🤖', title: 'Advanced AI', desc: 'Powered by Claude — Anthropic's state-of-the-art language model. Nuanced, context-aware responses.', color: 'blue' },
              { icon: '🌍', title: 'True Multilingual', desc: 'Native comprehension in 50+ languages. No translation layer — AI understands and responds naturally.', color: 'indigo' },
              { icon: '💬', title: 'WhatsApp Native', desc: 'Guests use the app they already have. No downloads, no friction, instant activation.', color: 'green' },
              { icon: '📊', title: 'Real-Time Analytics', desc: 'Guest sentiment, common questions, response quality. Data-driven insights to optimize operations.', color: 'purple' },
              { icon: '🔗', title: 'Seamless Integration', desc: 'Connect with PMS, booking systems, CRM. Unified guest data across your tech stack.', color: 'orange' },
              { icon: '🛡️', title: 'Enterprise Security', desc: 'SOC 2 Type II, GDPR, encryption at rest and in transit. Your data is protected.', color: 'red' },
            ].map((feature, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-200 transition-all hover:shadow-lg hover:border-blue-200 reveal">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-sans text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits ROI Focus */}
      <section id="benefits" className="relative z-[1] py-24 px-8 bg-slate-50">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-green-50 text-green-700 mb-4">ROI</span>
            <h2 className="font-sans text-[2.5rem] font-bold mb-4 text-slate-900">Measurable Business Impact</h2>
            <p className="text-lg text-slate-600 max-w-[600px] mx-auto">Improve guest satisfaction while reducing operational costs. Typical ROI realized within 3 months.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { 
                metric: '40% Reduction',
                title: 'in Guest Support Costs',
                desc: 'Automate repetitive inquiries. Redirect staff to high-value interactions.',
                icon: '💰',
                color: 'green'
              },
              { 
                metric: '2x Faster',
                title: 'Response Times',
                desc: 'Instant answers 24/7. No more waiting for front desk availability.',
                icon: '⚡',
                color: 'blue'
              },
              { 
                metric: '15% Higher',
                title: 'Guest Satisfaction Scores',
                desc: 'Personalized, instant service. Guests feel heard and valued.',
                icon: '⭐',
                color: 'yellow'
              },
              { 
                metric: '90% Coverage',
                title: 'of Common Inquiries',
                desc: 'WiFi, amenities, local info — handled automatically, accurately.',
                icon: '✅',
                color: 'indigo'
              },
            ].map((benefit, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md reveal">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{benefit.icon}</div>
                  <div>
                    <div className={`text-3xl font-bold mb-1 text-${benefit.color}-600`}>{benefit.metric}</div>
                    <h3 className="font-sans text-xl font-bold mb-2 text-slate-900">{benefit.title}</h3>
                    <p className="text-slate-600">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Professional */}
      <section id="pricing" className="relative z-[1] py-24 px-8 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 mb-4">Pricing</span>
            <h2 className="font-sans text-[2.5rem] font-bold mb-4 text-slate-900">Transparent, Scalable Pricing</h2>
            <p className="text-lg text-slate-600 max-w-[600px] mx-auto">Choose the plan that fits your property. Upgrade as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1000px] mx-auto">
            {[
              {
                name: 'Starter',
                price: '€99',
                desc: 'Perfect for boutique properties',
                features: ['1 property', '1,000 conversations/mo', 'Basic analytics', 'Email support'],
                cta: 'Start Trial',
                highlight: false
              },
              {
                name: 'Professional',
                price: '€299',
                desc: 'For growing hotel groups',
                features: ['5 properties', '5,000 conversations/mo', 'Advanced analytics', 'Priority support', 'Custom branding'],
                cta: 'Start Trial',
                highlight: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                desc: 'For large chains & resorts',
                features: ['Unlimited properties', 'Unlimited conversations', 'Dedicated manager', 'API access', 'SLA guarantees'],
                cta: 'Contact Sales',
                highlight: false
              },
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`rounded-2xl p-8 ${plan.highlight ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 scale-105' : 'bg-slate-50 border border-slate-200'} transition-all hover:shadow-xl reveal`}
              >
                <div className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-80">{plan.name}</div>
                <div className="text-4xl font-bold mb-2">{plan.price}</div>
                <div className={`text-sm mb-6 ${plan.highlight ? 'text-blue-100' : 'text-slate-600'}`}>{plan.desc}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${plan.highlight ? 'text-blue-200' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                      </svg>
                      <span className={plan.highlight ? 'text-white' : 'text-slate-700'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/signup" 
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-all no-underline ${
                    plan.highlight 
                      ? 'bg-white text-blue-600 hover:bg-blue-50' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-center py-20 px-8 relative">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-sans text-[2.5rem] font-bold text-white mb-4">
            Ready to elevate your guest experience?
          </h2>
          <p className="text-lg text-slate-400 mb-8">Join leading hospitality brands using HeyConcierge.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg no-underline transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/30">
            <span>Schedule Demo</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-8 text-center text-slate-400 text-sm">
        <p>© 2026 HeyConcierge. All rights reserved. &nbsp;·&nbsp; <a href="mailto:hello@heyconcierge.io" className="text-blue-400 no-underline hover:text-blue-300">hello@heyconcierge.io</a></p>
      </footer>
    </>
  )
}
