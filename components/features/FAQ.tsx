'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: 'General',
    question: 'What is HeyConcierge?',
    answer: 'HeyConcierge is an AI-powered guest communication platform for vacation rental hosts. It handles guest messages 24/7 via Telegram, WhatsApp, or SMS — providing instant answers to common questions and sending automated check-in instructions with personalized arrival details.',
  },
  {
    category: 'General',
    question: 'How does it work?',
    answer: '1. Connect your property calendar (Airbnb, VRBO, or any iCal feed)\n2. Place the QR code in your property or send it in booking confirmations\n3. Guests scan and chat — HeyConcierge answers questions and sends check-in details automatically\n4. You stay in control — review conversations and intervene anytime',
  },
  {
    category: 'General',
    question: 'Is it really available 24/7?',
    answer: 'Yes. HeyConcierge responds instantly to guest messages at any time, day or night. No more missing messages while you sleep or losing bookings because you didn\'t respond fast enough.',
  },
  {
    category: 'Pricing',
    question: 'How much does it cost?',
    answer: 'We offer flexible pricing:\n• Free Trial: 30 days, full access\n• Pay-per-property: $12.99/month per property\n• 10+ properties: Contact us for enterprise pricing',
  },
  {
    category: 'Pricing',
    question: 'Is there a setup fee?',
    answer: 'No. Setup is included in all plans.',
  },
  {
    category: 'Pricing',
    question: 'Can I cancel anytime?',
    answer: 'Yes. Cancel anytime with no penalties. Your service continues until the end of your billing period.',
  },
  {
    category: 'Setup',
    question: 'What platforms do you integrate with?',
    answer: 'HeyConcierge works with any platform that provides an iCal calendar feed: Airbnb, VRBO/HomeAway, Booking.com, direct bookings (Google Calendar, iCloud), and property management systems (Guesty, Hostaway, etc.)',
  },
  {
    category: 'Setup',
    question: 'How long does setup take?',
    answer: 'Less than 5 minutes:\n1. Paste your calendar link\n2. Add your property details\n3. Print the QR code for your property\n4. Done!',
  },
  {
    category: 'Setup',
    question: 'Which messaging channels are supported?',
    answer: 'HeyConcierge currently supports Telegram (via bot), with WhatsApp and SMS coming soon. Guests simply scan a QR code to start chatting — no app downloads or signups required.',
  },
  {
    category: 'Features',
    question: 'What questions can HeyConcierge answer?',
    answer: 'Common guest questions like: check-in time and instructions, WiFi password, house rules, local recommendations, parking information, appliance instructions, emergency contacts, and check-out procedures.',
  },
  {
    category: 'Features',
    question: 'Can I customize the responses?',
    answer: 'Yes. You can customize all automated messages and responses to match your property and communication style.',
  },
  {
    category: 'Features',
    question: 'Does it send check-in instructions automatically?',
    answer: 'Yes. When a new booking is detected, HeyConcierge automatically sends: welcome message, check-in time and instructions, WiFi details, important house rules, and your contact info. You control exactly when these are sent (e.g., 24 hours before arrival).',
  },
  {
    category: 'Privacy',
    question: 'Is guest data secure?',
    answer: 'Yes. We use bank-level encryption and never share guest data with third parties. We\'re GDPR compliant and take privacy seriously.',
  },
  {
    category: 'Privacy',
    question: 'What data do you store?',
    answer: 'Only what\'s necessary to provide the service: calendar data (dates, guest names), property details you provide, message history, and your contact information.',
  },
  {
    category: 'Support',
    question: 'What if I need help?',
    answer: 'We offer: live chat support, email support (response within 24 hours), setup assistance, and a knowledge base & guides.',
  },
  {
    category: 'Technical',
    question: 'Does it work in multiple languages?',
    answer: 'Yes. HeyConcierge can communicate in 50+ languages and automatically detects the guest\'s language.',
  },
  {
    category: 'Getting Started',
    question: 'Can I try it before buying?',
    answer: 'Yes! 30-day free trial with full access to all features.',
  },
];

const categories = ['All', 'General', 'Pricing', 'Setup', 'Features', 'Privacy', 'Support', 'Technical', 'Getting Started'];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredFAQs = selectedCategory === 'All'
    ? faqData
    : faqData.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      {/* Header */}
      <header className="px-8 py-4 border-b border-earth-border bg-white/90 backdrop-blur-[12px] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="no-underline flex items-center gap-2.5">
            <div className="w-8 h-8 bg-grove rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" />
                <path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" />
                <rect x="5" y="17" width="22" height="4" rx="1.5" />
              </svg>
            </div>
            <span className="font-serif text-earth-dark text-lg">HeyConcierge</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="text-sm text-earth-muted hover:text-earth-dark font-medium no-underline transition-colors">Dashboard</Link>
            <Link href="/" className="text-sm text-earth-muted hover:text-earth-dark font-medium no-underline transition-colors">Home</Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-grove uppercase mb-4">FAQ</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-earth-dark mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-earth-muted text-lg">
            Everything you need to know about HeyConcierge
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => { setSelectedCategory(category); setOpenIndex(null); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-grove text-white'
                  : 'bg-white border border-earth-border text-earth-muted hover:border-grove hover:text-grove'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="divide-y divide-earth-border border border-earth-border rounded-xl overflow-hidden bg-white">
          {filteredFAQs.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-grove-subtle transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-grove bg-grove-subtle px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
                    {item.category}
                  </span>
                  <span className="font-medium text-earth-dark">
                    {item.question}
                  </span>
                </div>
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`text-earth-muted transition-transform flex-shrink-0 ml-4 ${openIndex === index ? 'rotate-180' : ''}`}
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 py-5 bg-grove-subtle border-t border-earth-border">
                  <p className="text-earth-text whitespace-pre-line leading-relaxed text-sm">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center border-t border-earth-border pt-16">
          <h2 className="font-serif text-3xl text-earth-dark mb-3">
            Still have questions?
          </h2>
          <p className="text-earth-muted mb-8">
            We&apos;re here to help — get in touch and we&apos;ll answer anything.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@heyconcierge.io"
              className="px-7 py-3 bg-grove hover:bg-grove-dark text-white rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all no-underline"
            >
              Email Support
            </a>
            <Link
              href="/"
              className="px-7 py-3 border border-earth-border text-earth-text hover:border-grove hover:text-grove rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all no-underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
