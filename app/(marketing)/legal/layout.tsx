import Link from 'next/link'
import LogoSVG from '@/components/brand/LogoSVG'
import CookieSettingsLink from '@/components/ui/CookieSettingsLink'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #F5EDFF 50%, #FFF8F0 100%)' }}>

      {/* Header */}
      <nav className="sticky top-0 z-50 px-8 py-4 backdrop-blur-[20px] bg-[rgba(255,248,240,0.85)] border-b border-[rgba(108,92,231,0.08)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-nunito text-[1.4rem] font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-[#FD79A8]">Hey</span>
            <span className="text-[#2D2B55]">Concierge</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-[0.9rem] font-semibold text-[rgba(45,43,85,0.6)]">
            <Link href="/legal/privacy" className="hover:text-[#6C5CE7] transition no-underline">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-[#6C5CE7] transition no-underline">Terms of Service</Link>
            <Link href="/legal/dpa" className="hover:text-[#6C5CE7] transition no-underline">DPA</Link>
            <Link href="/legal/cookies" className="hover:text-[#6C5CE7] transition no-underline">Cookie Policy</Link>
          </div>
          <Link href="/login" className="no-underline bg-[#6C5CE7] text-white px-5 py-2 rounded-full font-bold text-[0.9rem] transition-all hover:bg-[#2D2B55] shadow-[0_4px_15px_rgba(108,92,231,0.3)]">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(108,92,231,0.1)] mt-16 py-10 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="font-nunito font-black no-underline flex items-center gap-2">
              <LogoSVG className="w-7 h-7" />
              <span className="text-[#FD79A8]">Hey</span>
              <span className="text-[#2D2B55]">Concierge</span>
            </Link>
            <p className="text-[0.85rem] text-[rgba(45,43,85,0.5)]">Made with 💜 in the Arctic · Tromsø, Norway</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[0.8rem] text-[rgba(45,43,85,0.45)]">
            <Link href="/legal/privacy" className="hover:text-[#6C5CE7] transition no-underline">Privacy Policy</Link>
            <span>·</span>
            <Link href="/legal/terms" className="hover:text-[#6C5CE7] transition no-underline">Terms of Service</Link>
            <span>·</span>
            <Link href="/legal/dpa" className="hover:text-[#6C5CE7] transition no-underline">DPA</Link>
            <span>·</span>
            <Link href="/legal/cookies" className="hover:text-[#6C5CE7] transition no-underline">Cookie Policy</Link>
            <span>·</span>
            <Link href="/legal/guest-privacy" className="hover:text-[#6C5CE7] transition no-underline">Guest Privacy</Link>
            <span>·</span>
            <CookieSettingsLink className="hover:text-[#6C5CE7] transition cursor-pointer bg-transparent border-0 p-0 text-[inherit] font-[inherit]" />
          </div>
        </div>
      </footer>

    </div>
  )
}
