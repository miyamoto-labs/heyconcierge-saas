import Link from 'next/link'
import CookieSettingsLink from '@/components/ui/CookieSettingsLink'
import ChatWidget from '@/components/chat/SimpleChatWidget'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="earth-page min-h-screen flex flex-col" style={{ background: '#FAFAF7', color: '#2C2C2C' }}>
      <div className="flex-1">
        {children}
      </div>
      <ChatWidget />
      <footer className="border-t border-earth-border py-5 px-8 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-earth-muted">
            © {new Date().getFullYear()} HeyConcierge. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-earth-muted">
            <Link href="/legal/privacy" className="hover:text-earth-dark transition no-underline">Privacy Policy</Link>
            <span>·</span>
            <Link href="/legal/terms" className="hover:text-earth-dark transition no-underline">Terms of Service</Link>
            <span>·</span>
            <Link href="/legal/cookies" className="hover:text-earth-dark transition no-underline">Cookie Policy</Link>
            <span>·</span>
            <CookieSettingsLink className="hover:text-earth-dark transition cursor-pointer bg-transparent border-0 p-0 text-[inherit] font-[inherit]" />
          </div>
        </div>
      </footer>
    </div>
  )
}
