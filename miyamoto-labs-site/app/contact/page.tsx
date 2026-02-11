"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact</h1>
            <p className="text-white/40 text-lg mb-12">Got a project? Question? Want custom development? Let&apos;s talk.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <a href="mailto:dostoyevskyai@gmail.com" className="gradient-border p-5 hover:bg-surface-light/30 transition-colors group block">
                <div className="text-lg mb-2">✉️</div>
                <div className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">Email</div>
                <div className="text-white/40 text-xs font-mono">dostoyevskyai@gmail.com</div>
              </a>
              <a href="https://twitter.com/dostoyevskyai" target="_blank" className="gradient-border p-5 hover:bg-surface-light/30 transition-colors group block">
                <div className="text-lg mb-2">𝕏</div>
                <div className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">Twitter</div>
                <div className="text-white/40 text-xs font-mono">@dostoyevskyai</div>
              </a>
              <div className="gradient-border p-5">
                <div className="text-lg mb-2">📍</div>
                <div className="font-semibold text-sm mb-1">Location</div>
                <div className="text-white/40 text-xs">Oslo, Norway 🇳🇴</div>
              </div>
            </div>

            {!submitted ? (
              <div className="gradient-border p-8">
                <h2 className="font-semibold mb-6">Send a Message</h2>
                <form
                  action="https://formsubmit.co/dostoyevskyai@gmail.com"
                  method="POST"
                  onSubmit={() => setSubmitted(true)}
                  className="space-y-4"
                >
                  <input type="hidden" name="_subject" value="Miyamoto Labs — Contact Form" />
                  <input type="hidden" name="_captcha" value="false" />
                  <input type="hidden" name="_next" value="https://miyamotolabs.com/contact?sent=true" />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/30 uppercase tracking-wider block mb-2">Name</label>
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder="Your name"
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/30 uppercase tracking-wider block mb-2">Email</label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="your@email.com"
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/30 uppercase tracking-wider block mb-2">Subject</label>
                    <select
                      name="subject_type"
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-accent/50 focus:outline-none transition-colors"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="custom-dev">Custom Development</option>
                      <option value="partnership">Partnership</option>
                      <option value="support">Product Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/30 uppercase tracking-wider block mb-2">Message</label>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      placeholder="Tell us what you need..."
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                  <button type="submit" className="w-full bg-accent hover:bg-accent-light text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm">
                    Send Message →
                  </button>
                </form>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="gradient-border p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-xl font-bold mb-2">Message Sent!</h2>
                <p className="text-white/40 text-sm">We&apos;ll get back to you within 24 hours.</p>
              </motion.div>
            )}

            <div className="text-center pt-8">
              <p className="text-white/20 text-sm">Available worldwide — Response time: &lt; 24 hours</p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
