import Link from 'next/link'
import CookieSettingsLink from '@/components/ui/CookieSettingsLink'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" >

      {/* Header */}
      <nav className="sticky top-0 z-50 px-8 py-4 backdrop-blur-[12px] bg-white/80 border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-[1.4rem] font-extrabold text-slate-800 tracking-tight no-underline flex items-center gap-2">
            <img src="/message_logo.png" alt="HeyConcierge" className="w-8 h-8 rounded-lg" />
            <span className="text-slate-800">Hey
            <span className="text-primary">Concierge</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <Link href="/legal/privacy" className="hover:text-slate-600 transition no-underline">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-slate-600 transition no-underline">Terms of Service</Link>
            <Link href="/legal/dpa" className="hover:text-slate-600 transition no-underline">DPA</Link>
            <Link href="/legal/cookies" className="hover:text-slate-600 transition no-underline">Cookie Policy</Link>
          </div>
          <Link href="/login" className="no-underline bg-primary text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-primary-dark ">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-10 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="font-bold text-slate-800 no-underline flex items-center gap-2">
              <img src="/message_logo.png" alt="HeyConcierge" className="w-8 h-8 rounded-lg" />
              <span className="text-slate-800">Hey
              <span className="text-primary">Concierge</span></span>
            </Link>
            <p className="text-xs text-slate-400">© 2026 HeyConcierge. All rights reserved.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <Link href="/legal/privacy" className="hover:text-slate-600 transition no-underline">Privacy Policy</Link>
            <span>·</span>
            <Link href="/legal/terms" className="hover:text-slate-600 transition no-underline">Terms of Service</Link>
            <span>·</span>
            <Link href="/legal/dpa" className="hover:text-slate-600 transition no-underline">DPA</Link>
            <span>·</span>
            <Link href="/legal/cookies" className="hover:text-slate-600 transition no-underline">Cookie Policy</Link>
            <span>·</span>
            <Link href="/legal/guest-privacy" className="hover:text-slate-600 transition no-underline">Guest Privacy</Link>
            <span>·</span>
            <CookieSettingsLink className="hover:text-slate-600 transition cursor-pointer bg-transparent border-0 p-0 text-[inherit] font-[inherit]" />
          </div>
        </div>
      </footer>

    </div>
  )
}
