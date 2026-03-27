import Link from 'next/link'
import CookieSettingsLink from '@/components/ui/CookieSettingsLink'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="earth-page min-h-screen" style={{ background: '#FAFAF7' }}>

      {/* Header */}
      <header className="sticky top-0 z-50 px-8 py-4 backdrop-blur-[12px] bg-white/90 border-b border-earth-border">
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
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-earth-muted">
            <Link href="/legal/privacy" className="hover:text-earth-dark transition-colors no-underline">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-earth-dark transition-colors no-underline">Terms of Service</Link>
            <Link href="/legal/dpa" className="hover:text-earth-dark transition-colors no-underline">DPA</Link>
            <Link href="/legal/cookies" className="hover:text-earth-dark transition-colors no-underline">Cookie Policy</Link>
          </div>
          <Link href="/login" className="no-underline bg-grove hover:bg-grove-dark text-white px-5 py-2 rounded-full font-medium text-sm transition-all">
            Sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-earth-border mt-16 py-10 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="no-underline flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" stroke="#4A5D23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" />
                <path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" />
                <rect x="5" y="17" width="22" height="4" rx="1.5" />
              </svg>
              <span className="text-sm font-medium text-earth-dark">HeyConcierge</span>
            </Link>
            <p className="text-xs text-earth-light">© {new Date().getFullYear()} HeyConcierge. All rights reserved.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-earth-muted">
            <Link href="/legal/privacy" className="hover:text-earth-dark transition-colors no-underline">Privacy Policy</Link>
            <span>·</span>
            <Link href="/legal/terms" className="hover:text-earth-dark transition-colors no-underline">Terms of Service</Link>
            <span>·</span>
            <Link href="/legal/dpa" className="hover:text-earth-dark transition-colors no-underline">DPA</Link>
            <span>·</span>
            <Link href="/legal/cookies" className="hover:text-earth-dark transition-colors no-underline">Cookie Policy</Link>
            <span>·</span>
            <Link href="/legal/guest-privacy" className="hover:text-earth-dark transition-colors no-underline">Guest Privacy</Link>
            <span>·</span>
            <CookieSettingsLink className="hover:text-earth-dark transition-colors cursor-pointer bg-transparent border-0 p-0 text-[inherit] font-[inherit]" />
          </div>
        </div>
      </footer>

    </div>
  )
}
