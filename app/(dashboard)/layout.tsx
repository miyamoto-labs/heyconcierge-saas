import Link from 'next/link'
import CookieSettingsLink from '@/components/ui/CookieSettingsLink'
import ChatWidget from '@/components/chat/SimpleChatWidget'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <ChatWidget />
      <footer className="border-t border-slate-200/80 py-5 px-8 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} HeyConcierge. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <Link href="/legal/privacy" className="hover:text-slate-600 transition no-underline">Privacy Policy</Link>
            <span>·</span>
            <Link href="/legal/terms" className="hover:text-slate-600 transition no-underline">Terms of Service</Link>
            <span>·</span>
            <Link href="/legal/cookies" className="hover:text-slate-600 transition no-underline">Cookie Policy</Link>
            <span>·</span>
            <CookieSettingsLink className="hover:text-slate-600 transition cursor-pointer bg-transparent border-0 p-0 text-[inherit] font-[inherit]" />
          </div>
        </div>
      </footer>
    </div>
  )
}
