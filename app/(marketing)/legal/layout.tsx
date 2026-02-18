import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">HeyConcierge</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <Link href="/legal/privacy" className="hover:text-gray-900 transition">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-gray-900 transition">Terms of Service</Link>
            <Link href="/legal/dpa" className="hover:text-gray-900 transition">DPA</Link>
            <Link href="/legal/cookies" className="hover:text-gray-900 transition">Cookie Policy</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-sm text-gray-400 flex flex-wrap gap-4">
          <Link href="/legal/privacy" className="hover:text-gray-600 transition">Privacy Policy</Link>
          <Link href="/legal/terms" className="hover:text-gray-600 transition">Terms of Service</Link>
          <Link href="/legal/dpa" className="hover:text-gray-600 transition">DPA</Link>
          <Link href="/legal/cookies" className="hover:text-gray-600 transition">Cookie Policy</Link>
          <Link href="/legal/guest-privacy" className="hover:text-gray-600 transition">Guest Privacy Notice</Link>
        </div>
      </footer>
    </div>
  )
}
