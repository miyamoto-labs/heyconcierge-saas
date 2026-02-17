'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import LogoSVG from '@/components/LogoSVG';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: 'General',
    question: 'What is HeyConcierge?',
    answer: 'HeyConcierge is an AI-powered guest communication platform for vacation rental hosts. It handles guest messages 24/7 via WhatsApp, provides instant answers to common questions, and sends automated check-in instructions with personalized arrival details.',
  },
  {
    category: 'General',
    question: 'How does it work?',
    answer: '1. Connect your property calendar (Airbnb, VRBO, or any iCal feed)\n2. Add your WhatsApp number to your listing\n3. HeyConcierge automatically sends guests their check-in details and answers questions\n4. You stay in control — review conversations and intervene anytime',
  },
  {
    category: 'General',
    question: 'Is it really available 24/7?',
    answer: 'Yes. HeyConcierge responds instantly to guest messages at any time, day or night. No more missing messages while you sleep or losing bookings because you didn\'t respond fast enough.',
  },
  {
    category: 'Pricing',
    question: 'How much does it cost?',
    answer: 'We offer flexible pricing:\n• Free Trial: 14 days, full access, no credit card required\n• Pay-per-property: $29/month per property\n• Multi-property discount: Contact us for volume pricing',
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
    answer: 'HeyConcierge works with any platform that provides an iCal calendar feed: Airbnb, VRBO/HomeAway, Booking.com, Direct bookings (Google Calendar, iCloud), and Property management systems (Guesty, Hostaway, etc.)',
  },
  {
    category: 'Setup',
    question: 'How long does setup take?',
    answer: 'Less than 5 minutes:\n1. Paste your calendar link\n2. Add your property details\n3. Set your WhatsApp number\n4. Done!',
  },
  {
    category: 'Setup',
    question: 'Do I need a separate WhatsApp number?',
    answer: 'We recommend using a dedicated business WhatsApp number, but you can use your personal number if preferred. WhatsApp Business API is not required.',
  },
  {
    category: 'Features',
    question: 'What questions can HeyConcierge answer?',
    answer: 'Common guest questions like: Check-in time and instructions, WiFi password, House rules, Local recommendations, Parking information, Appliance instructions, Emergency contacts, and Check-out procedures.',
  },
  {
    category: 'Features',
    question: 'Can I customize the responses?',
    answer: 'Yes. You can customize all automated messages and responses to match your property and communication style.',
  },
  {
    category: 'Features',
    question: 'Does it send check-in instructions automatically?',
    answer: 'Yes. When a new booking is detected, HeyConcierge automatically sends: Welcome message, Check-in time and instructions, WiFi details, Important house rules, and Your contact info. You control exactly when these are sent (e.g., 24 hours before arrival).',
  },
  {
    category: 'Privacy',
    question: 'Is guest data secure?',
    answer: 'Yes. We use bank-level encryption and never share guest data with third parties. We\'re GDPR compliant and take privacy seriously.',
  },
  {
    category: 'Privacy',
    question: 'What data do you store?',
    answer: 'Only what\'s necessary to provide the service: Calendar data (dates, guest names), Property details you provide, Message history, and Your contact information.',
  },
  {
    category: 'Support',
    question: 'What if I need help?',
    answer: 'We offer: Live chat support, Email support (response within 24 hours), Setup assistance, and Knowledge base & guides.',
  },
  {
    category: 'Technical',
    question: 'Does it work in multiple languages?',
    answer: 'Yes. HeyConcierge can communicate in 50+ languages and automatically detects the guest\'s language.',
  },
  {
    category: 'Getting Started',
    question: 'Can I try it before buying?',
    answer: 'Yes! 14-day free trial with full access to all features. No credit card required.',
  },
];

const categories = ['General', 'Pricing', 'Setup', 'Features', 'Privacy', 'Support', 'Technical', 'Getting Started'];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredFAQs = selectedCategory === 'All'
    ? faqData
    : faqData.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-bg">
      <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-dark font-bold">Dashboard</Link>
            <Link href="/" className="text-sm text-muted hover:text-dark font-bold">Home</Link>
          </div>
        </div>
      </header>
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-gray-600">
          Everything you need to know about HeyConcierge
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'All'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        {filteredFAQs.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {item.category}
                </span>
                <span className="font-semibold text-gray-900">
                  {item.question}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-16 text-center bg-blue-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Still have questions?
        </h2>
        <p className="text-gray-600 mb-6">
          We're here to help! Get in touch and we'll answer any questions you have.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:support@heyconcierge.io"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Email Support
          </a>
          <button className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Schedule a Demo
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
