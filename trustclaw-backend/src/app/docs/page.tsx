'use client'

import Header from '@/components/Header'
import { Shield, Book, Code, Terminal, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DocsPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Documentation</h1>

        <div className="space-y-8">
          {/* Quick Start */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="h-6 w-6 text-trust-green" />
              <h2 className="text-2xl font-semibold">Quick Start</h2>
            </div>
            <p className="text-dark-muted mb-4">
              Install verified skills with a single command:
            </p>
            <div className="bg-dark-bg rounded-lg p-4 font-mono text-sm">
              <p className="text-dark-muted"># Install a verified skill</p>
              <p className="text-trust-green">openclaw skill install skill-name</p>
              <p className="text-dark-muted mt-2"># List installed skills</p>
              <p className="text-trust-green">openclaw skill list</p>
              <p className="text-dark-muted mt-2"># Remove a skill</p>
              <p className="text-trust-green">openclaw skill remove skill-name</p>
            </div>
          </section>

          {/* Publishing */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Book className="h-6 w-6 text-trust-green" />
              <h2 className="text-2xl font-semibold">Publishing Skills</h2>
            </div>
            <ol className="space-y-4 text-dark-muted">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-trust-green/20 text-trust-green flex items-center justify-center text-sm shrink-0">1</span>
                <div>
                  <strong className="text-white">Create your skill</strong>
                  <p>Write your skill following the OpenClaw skill structure. Include a SKILL.md file with documentation.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-trust-green/20 text-trust-green flex items-center justify-center text-sm shrink-0">2</span>
                <div>
                  <strong className="text-white">Push to GitHub</strong>
                  <p>Make your repository public on GitHub. This is required for automated security scanning.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-trust-green/20 text-trust-green flex items-center justify-center text-sm shrink-0">3</span>
                <div>
                  <strong className="text-white">Submit for review</strong>
                  <p>Use the <Link href="/submit" className="text-trust-green hover:underline">submit form</Link> to request verification.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-trust-green/20 text-trust-green flex items-center justify-center text-sm shrink-0">4</span>
                <div>
                  <strong className="text-white">Security scan + review</strong>
                  <p>Our automated scanner checks for security issues. Then a human reviewer approves or rejects.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-trust-green/20 text-trust-green flex items-center justify-center text-sm shrink-0">5</span>
                <div>
                  <strong className="text-white">Published!</strong>
                  <p>Once approved, your skill appears in the marketplace for everyone to install.</p>
                </div>
              </li>
            </ol>
          </section>

          {/* Security Guidelines */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-trust-green" />
              <h2 className="text-2xl font-semibold">Security Guidelines</h2>
            </div>
            <p className="text-dark-muted mb-4">
              To pass the security scan, your skill should avoid:
            </p>
            <ul className="space-y-2 text-dark-muted">
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span>
                Shell command execution (exec, spawn, system calls)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span>
                Reading credential files (.env, .ssh, API keys)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span>
                External network requests to non-allowlisted domains
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span>
                Obfuscated or minified code
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span>
                eval() or new Function() usage
              </li>
            </ul>
            <p className="text-dark-muted mt-4">
              If your skill needs these capabilities, explain the use case in your submission
              and our reviewers will evaluate it manually.
            </p>
          </section>

          {/* Skill Structure */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Code className="h-6 w-6 text-trust-green" />
              <h2 className="text-2xl font-semibold">Skill Structure</h2>
            </div>
            <p className="text-dark-muted mb-4">
              A typical skill directory structure:
            </p>
            <div className="bg-dark-bg rounded-lg p-4 font-mono text-sm">
              <pre className="text-dark-muted">{`my-skill/
├── SKILL.md          # Documentation (required)
├── index.ts          # Main entry point
├── package.json      # Dependencies
├── lib/
│   └── helpers.ts    # Helper functions
└── tests/
    └── index.test.ts # Tests (recommended)`}</pre>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center pt-8">
            <Link href="/submit" className="btn-trust px-8 py-3 inline-flex items-center gap-2">
              Submit Your First Skill
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
