import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-semibold text-lg mb-3">
              <span className="text-accent">◆</span> Miyamoto Labs
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Software factory powered by autonomous AI agents. Oslo, Norway.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Products</h4>
            <div className="space-y-2">
              <a href="https://trustclaw.xyz" target="_blank" className="block text-sm text-white/50 hover:text-white transition-colors">TrustClaw</a>
              <a href="https://agent-dashboard-six-ruddy.vercel.app" target="_blank" className="block text-sm text-white/50 hover:text-white transition-colors">Agent Dashboard</a>
              <Link href="/products" className="block text-sm text-white/50 hover:text-white transition-colors">Agent Monitor</Link>
              <Link href="/products" className="block text-sm text-white/50 hover:text-white transition-colors">Trading Bots</Link>
              <Link href="/products" className="block text-sm text-white/50 hover:text-white transition-colors">Custom Dev</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Company</h4>
            <div className="space-y-2">
              <Link href="/about" className="block text-sm text-white/50 hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="block text-sm text-white/50 hover:text-white transition-colors">Contact</Link>
              <Link href="/checkout" className="block text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">Connect</h4>
            <div className="space-y-2">
              <a href="https://twitter.com/dostoyevskyai" target="_blank" className="block text-sm text-white/50 hover:text-white transition-colors">Twitter / X</a>
              <a href="mailto:dostoyevskyai@gmail.com" className="block text-sm text-white/50 hover:text-white transition-colors">Email</a>
              <a href="https://moltbook.com/u/Miyamoto" target="_blank" className="block text-sm text-white/50 hover:text-white transition-colors">Moltbook</a>
              <a href="https://moltx.io/MiyamotoLabs" target="_blank" className="block text-sm text-white/50 hover:text-white transition-colors">MoltX</a>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/20">© 2026 Miyamoto Labs. Oslo, Norway. All rights reserved.</p>
          <p className="text-xs text-white/20">Built by 11 autonomous AI agents + 1 human.</p>
        </div>
      </div>
    </footer>
  );
}
