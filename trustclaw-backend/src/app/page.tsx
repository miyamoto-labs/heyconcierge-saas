import Link from 'next/link'
import Header from '@/components/Header'
import { Shield, CheckCircle, AlertTriangle, Lock, Zap, Code, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-trust-green/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-trust-green/10 border border-trust-green/30 rounded-full px-4 py-2 mb-8">
                <Shield className="h-4 w-4 text-trust-green" />
                <span className="text-sm text-trust-green">Security-First Skill Marketplace</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Trust Layer for{' '}
                <span className="text-trust-green">AI Agent Skills</span>
              </h1>
              
              <p className="text-xl text-dark-muted max-w-2xl mx-auto mb-10">
                Every skill verified. Every agent secure. The first security-scanned
                marketplace for OpenClaw skills.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/skills" className="btn-trust px-8 py-3 text-lg inline-flex items-center justify-center gap-2">
                  Browse Skills
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/submit" className="px-8 py-3 text-lg border border-dark-border rounded-lg hover:border-trust-green/50 transition-colors inline-flex items-center justify-center gap-2">
                  Submit Your Skill
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 border-t border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why TrustClaw?</h2>
              <p className="text-dark-muted max-w-2xl mx-auto">
                Skills extend AI agent capabilities. But unvetted skills are a security nightmare.
                We scan everything so you don&apos;t have to worry.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="card">
                <div className="w-12 h-12 bg-trust-green/10 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-trust-green" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Automated Scanning</h3>
                <p className="text-dark-muted">
                  Every skill is automatically scanned for malicious patterns, credential access,
                  shell execution, and obfuscated code.
                </p>
              </div>

              <div className="card">
                <div className="w-12 h-12 bg-trust-green/10 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-trust-green" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Human Review</h3>
                <p className="text-dark-muted">
                  After automated scanning, human reviewers verify the code quality
                  and functionality before approval.
                </p>
              </div>

              <div className="card">
                <div className="w-12 h-12 bg-trust-green/10 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-trust-green" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Install</h3>
                <p className="text-dark-muted">
                  One command to install verified skills. No manual review needed—
                  we&apos;ve already done it for you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Checks Section */}
        <section className="py-20 border-t border-dark-border bg-dark-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">What We Scan For</h2>
                <div className="space-y-4">
                  {[
                    { icon: AlertTriangle, text: 'Shell command execution (exec, spawn, system)' },
                    { icon: AlertTriangle, text: 'Credential file access (.env, .ssh, API keys)' },
                    { icon: AlertTriangle, text: 'External network requests to suspicious domains' },
                    { icon: AlertTriangle, text: 'Obfuscated or minified code' },
                    { icon: AlertTriangle, text: 'Known malicious patterns (miners, backdoors)' },
                    { icon: AlertTriangle, text: 'Filesystem operations on sensitive paths' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-yellow-400 shrink-0" />
                      <span className="text-dark-muted">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card bg-dark-bg border-trust-green/30 glow-green">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-trust-green" />
                  <span className="font-semibold text-trust-green">Scan Result: PASS</span>
                </div>
                <div className="font-mono text-sm text-dark-muted space-y-1">
                  <p>✓ No shell execution detected</p>
                  <p>✓ No credential access detected</p>
                  <p>✓ No suspicious network requests</p>
                  <p>✓ Code is readable and unobfuscated</p>
                  <p>✓ No known malicious patterns</p>
                </div>
                <div className="mt-6 pt-4 border-t border-dark-border">
                  <code className="text-trust-green text-sm">
                    openclaw skill install example-skill
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 border-t border-dark-border">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Publish?</h2>
            <p className="text-dark-muted mb-8">
              Share your skills with the community. Submit your skill for review
              and reach thousands of AI agents running OpenClaw.
            </p>
            <Link href="/submit" className="btn-trust px-8 py-3 text-lg inline-flex items-center gap-2">
              <Code className="h-5 w-5" />
              Submit Your Skill
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-trust-green" />
                <span className="font-bold">TrustClaw</span>
              </div>
              <div className="flex items-center gap-6 text-dark-muted text-sm">
                <Link href="/skills" className="hover:text-white transition-colors">Skills</Link>
                <Link href="/submit" className="hover:text-white transition-colors">Submit</Link>
                <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
                <a href="https://github.com/trustclaw" className="hover:text-white transition-colors">GitHub</a>
                <a href="https://x.com/trustclawai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">𝕏 @trustclawai</a>
              </div>
              <div className="text-dark-muted text-sm">
                © 2026 <a href="https://miyamotolabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Miyamoto Labs</a>. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
