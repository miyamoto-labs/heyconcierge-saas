import Link from "next/link";

// Mock threat stats - in production these would come from an API
const threatStats = {
  maliciousBlocked: 341,
  verifiedSkills: 847,
  leaksPrevented: 283,
};

// Featured skills data
const featuredSkills = [
  {
    id: "hyperliquid-trader",
    name: "hyperliquid-trader",
    author: "@miyamoto-labs",
    version: "v2.1.0",
    badge: "verified" as const,
    downloads: "12.4k",
    icon: "📈",
    iconBg: "#00e87b15",
    iconBorder: "#00e87b33",
  },
  {
    id: "whale-scanner-pro",
    name: "whale-scanner-pro",
    author: "@cryptodev42",
    version: "v1.8.3",
    badge: "verified" as const,
    downloads: "8.7k",
    icon: "🐋",
    iconBg: "#00c2ff15",
    iconBorder: "#00c2ff33",
  },
  {
    id: "solana-wallet-tracker",
    name: "solana-wallet-tracker",
    author: "@anon_dev99",
    version: "v0.9.1",
    badge: "warning" as const,
    downloads: "3.2k",
    icon: "💰",
    iconBg: "#ff8a2b15",
    iconBorder: "#ff8a2b33",
  },
  {
    id: "defi-yield-optimizer",
    name: "defi-yield-optimizer",
    author: "@quick_profit",
    version: "v1.0.0",
    badge: "blocked" as const,
    downloads: "—",
    icon: "🔑",
    iconBg: "#ff3b4f15",
    iconBorder: "#ff3b4f33",
  },
];

export default function Home() {
  return (
    <div className="w-full">
      {/* === HERO === */}
      <section className="relative z-10 pt-44 pb-24 px-6 md:px-10 max-w-[1200px] mx-auto text-center">
        {/* Threat Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#ff3b4f18] border-l-[3px] border-l-[#ff3b4f] rounded bg-[#ff3b4f18] font-[family-name:var(--font-jetbrains)] text-xs text-[#ff3b4f] mb-8 tracking-wide animate-pulse-badge animate-fade-in-up">
          <span>⚠</span> 341 malicious skills found on ClawHub this week
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-space-mono)] text-5xl md:text-7xl lg:text-[84px] font-bold leading-[1.05] tracking-[-3px] mb-7 animate-fade-in-up-delay-1">
          The <span className="text-[#00e87b] relative">
            safe side
            <span className="absolute bottom-0.5 left-0 w-full h-2 bg-[#00e87b] opacity-15 rounded-sm" />
          </span><br />
          of OpenClaw.
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-[#6b7a94] max-w-[620px] mx-auto mb-12 leading-relaxed font-normal animate-fade-in-up-delay-2">
          Curated, security-verified skills for your AI agent.
          <strong className="text-[#e8ecf4] font-semibold"> Every skill scanned. Every publisher verified. Zero malware.</strong>
        </p>

        {/* CTAs */}
        <div className="flex gap-4 justify-center mb-16 animate-fade-in-up-delay-3">
          <Link 
            href="#waitlist" 
            className="bg-[#00e87b] text-[#06080c] px-6 py-2.5 rounded-md font-bold text-sm no-underline transition-all hover:shadow-[0_0_30px_#00e87b30] hover:-translate-y-0.5"
          >
            Join the Waitlist
          </Link>
          <Link 
            href="/skills" 
            className="border border-[#1a2235] text-[#e8ecf4] px-6 py-2.5 rounded-md font-semibold text-sm no-underline bg-transparent transition-all hover:border-[#00e87b] hover:bg-[#00e87b22]"
          >
            View Verified Skills →
          </Link>
        </div>

        {/* Threat Ticker */}
        <div className="bg-[#0f1420] border border-[#1a2235] rounded-lg py-4 px-7 inline-flex items-center gap-6 font-[family-name:var(--font-jetbrains)] text-[13px] animate-fade-in-up-delay-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff3b4f] animate-blink" />
            <span className="text-[#3a4560]">Malicious skills blocked</span>
            <span className="text-[#ff3b4f] font-bold">{threatStats.maliciousBlocked}</span>
          </div>
          <div className="w-px h-6 bg-[#1a2235]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00e87b] animate-blink" />
            <span className="text-[#3a4560]">Verified skills</span>
            <span className="text-[#00e87b] font-bold">{threatStats.verifiedSkills}</span>
          </div>
          <div className="w-px h-6 bg-[#1a2235]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff8a2b] animate-blink" />
            <span className="text-[#3a4560]">Credential leaks prevented</span>
            <span className="text-[#e8ecf4] font-bold">{threatStats.leaksPrevented}</span>
          </div>
        </div>
      </section>

      {/* === PROBLEM SECTION === */}
      <section className="relative z-10 py-24 px-6 md:px-10 max-w-[1200px] mx-auto" id="security">
        <div className="font-[family-name:var(--font-jetbrains)] text-[11px] tracking-[3px] uppercase text-[#00e87b] mb-4">
          THE PROBLEM
        </div>
        <h2 className="font-[family-name:var(--font-space-mono)] text-4xl md:text-5xl font-bold tracking-[-2px] mb-5 leading-[1.1]">
          ClawHub is a<br />security disaster.
        </h2>
        <p className="text-lg text-[#6b7a94] max-w-[600px] leading-relaxed mb-14">
          This week, researchers discovered what OpenClaw users feared.
          The skills marketplace is wide open to malware, credential theft, and backdoors.
        </p>

        {/* Threat Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-8 relative overflow-hidden transition-all hover:border-[#ff3b4f] hover:bg-[#141b2a] hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ff3b4f] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="font-[family-name:var(--font-space-mono)] text-[42px] font-bold text-[#ff3b4f] mb-2">341</div>
            <h3 className="text-base font-bold mb-2.5 tracking-tight">Malicious Skills</h3>
            <p className="text-sm text-[#6b7a94] leading-relaxed">335 tied to a single campaign installing Atomic Stealer malware on macOS. Fake crypto tools, weather apps, and wallet trackers.</p>
            <div className="font-[family-name:var(--font-jetbrains)] text-[11px] text-[#3a4560] mt-4 pt-3 border-t border-[#1a2235]">
              Source: Koi Security / The Hacker News
            </div>
          </div>
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-8 relative overflow-hidden transition-all hover:border-[#ff3b4f] hover:bg-[#141b2a] hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ff3b4f] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="font-[family-name:var(--font-space-mono)] text-[42px] font-bold text-[#ff3b4f] mb-2">7.1%</div>
            <h3 className="text-base font-bold mb-2.5 tracking-tight">Skills Leak Your Secrets</h3>
            <p className="text-sm text-[#6b7a94] leading-relaxed">283 ClawHub skills expose API keys, SSH credentials, and passwords. Including popular skills with thousands of installs.</p>
            <div className="font-[family-name:var(--font-jetbrains)] text-[11px] text-[#3a4560] mt-4 pt-3 border-t border-[#1a2235]">
              Source: Snyk / The Register
            </div>
          </div>
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-8 relative overflow-hidden transition-all hover:border-[#ff3b4f] hover:bg-[#141b2a] hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ff3b4f] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="font-[family-name:var(--font-space-mono)] text-[42px] font-bold text-[#ff3b4f] mb-2">0</div>
            <h3 className="text-base font-bold mb-2.5 tracking-tight">Verification Required</h3>
            <p className="text-sm text-[#6b7a94] leading-relaxed">Anyone with a 1-week-old GitHub account can publish skills. No code review. No security scan. No accountability.</p>
            <div className="font-[family-name:var(--font-jetbrains)] text-[11px] text-[#3a4560] mt-4 pt-3 border-t border-[#1a2235]">
              Source: VirusTotal Blog
            </div>
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="relative z-10 py-24 px-6 md:px-10 max-w-[1200px] mx-auto" id="skills">
        <div className="font-[family-name:var(--font-jetbrains)] text-[11px] tracking-[3px] uppercase text-[#00e87b] mb-4">
          HOW TRUSTCLAW WORKS
        </div>
        <h2 className="font-[family-name:var(--font-space-mono)] text-4xl md:text-5xl font-bold tracking-[-2px] mb-5 leading-[1.1]">
          Every skill. Scanned.<br />Verified. Trusted.
        </h2>
        <p className="text-lg text-[#6b7a94] max-w-[600px] leading-relaxed mb-14">
          We run every OpenClaw skill through automated security analysis
          before it reaches your agent. Here&apos;s how.
        </p>

        {/* How Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-9 relative transition-all hover:border-[#00e87b] hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00e87b] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="font-[family-name:var(--font-jetbrains)] text-xs text-[#00e87b] mb-5 tracking-wider">01 — SCAN</div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">AI Security Analysis</h3>
            <p className="text-sm text-[#6b7a94] leading-relaxed">Our agent scans every skill for obfuscated code, external downloads, credential access, prompt injection vectors, and known malicious patterns. Automatically. Continuously.</p>
          </div>
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-9 relative transition-all hover:border-[#00e87b] hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00e87b] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="font-[family-name:var(--font-jetbrains)] text-xs text-[#00e87b] mb-5 tracking-wider">02 — VERIFY</div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">Publisher Verification</h3>
            <p className="text-sm text-[#6b7a94] leading-relaxed">Skill publishers stake $TCLAW tokens to earn Verified status. Malicious publishers lose their stake. Skin in the game creates trust.</p>
          </div>
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-9 relative transition-all hover:border-[#00e87b] hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00e87b] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="font-[family-name:var(--font-jetbrains)] text-xs text-[#00e87b] mb-5 tracking-wider">03 — INSTALL</div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">One-Click Deploy</h3>
            <p className="text-sm text-[#6b7a94] leading-relaxed">Browse by category, check the safety score, read community reviews. Install with a single command. Your agent gets safer skills, faster.</p>
          </div>
        </div>

        {/* Skill Preview List */}
        <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl overflow-hidden mt-14">
          <div className="px-6 py-4 border-b border-[#1a2235] flex items-center gap-3 font-[family-name:var(--font-jetbrains)] text-[13px] text-[#3a4560]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff3b4f]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff8a2b]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00e87b]" />
            <span className="ml-2">trustclaw browse --category trading</span>
          </div>
          <div>
            {featuredSkills.map((skill) => (
              <Link 
                key={skill.id} 
                href={`/skills/${skill.id}`}
                className="grid grid-cols-[44px_1fr_120px_100px_90px] md:grid-cols-[44px_1fr_120px_100px_90px] items-center py-4 px-6 border-b border-[#1a2235] last:border-b-0 transition-colors hover:bg-[#141b2a] no-underline gap-4"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: skill.iconBg, border: `1px solid ${skill.iconBorder}` }}
                >
                  {skill.icon}
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold mb-0.5 tracking-tight text-[#e8ecf4]">{skill.name}</h4>
                  <p className="text-xs text-[#3a4560] font-[family-name:var(--font-jetbrains)]">by {skill.author} · {skill.version}</p>
                </div>
                <span className={`font-[family-name:var(--font-jetbrains)] text-[11px] py-1 px-2.5 rounded font-semibold w-fit ${
                  skill.badge === 'verified' ? 'bg-[#00e87b22] text-[#00e87b] border border-[#00e87b33]' :
                  skill.badge === 'warning' ? 'bg-[#ff8a2b15] text-[#ff8a2b] border border-[#ff8a2b33]' :
                  'bg-[#ff3b4f18] text-[#ff3b4f] border border-[#ff3b4f33]'
                }`}>
                  {skill.badge === 'verified' ? '✓ VERIFIED' : skill.badge === 'warning' ? '⚠ REVIEW' : '✕ BLOCKED'}
                </span>
                <div className="font-[family-name:var(--font-jetbrains)] text-[13px] text-[#6b7a94] text-right hidden md:block">{skill.downloads}</div>
                <div className="text-right hidden md:block">
                  <button 
                    className={`font-[family-name:var(--font-jetbrains)] text-[11px] py-1.5 px-3.5 rounded border border-[#1a2235] bg-transparent text-[#6b7a94] cursor-pointer transition-all hover:border-[#00e87b] hover:text-[#00e87b] ${skill.badge === 'blocked' ? 'opacity-30 cursor-not-allowed' : ''}`}
                    disabled={skill.badge === 'blocked'}
                  >
                    {skill.badge === 'blocked' ? 'blocked' : skill.badge === 'warning' ? 'inspect' : 'install'}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* === TOKEN SECTION === */}
      <section className="bg-[#0c1018] border-y border-[#1a2235] py-24 px-6 md:px-10 mt-10" id="token">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <div className="font-[family-name:var(--font-jetbrains)] text-[11px] tracking-[3px] uppercase text-[#00e87b] mb-4">
              $TCLAW TOKEN
            </div>
            <h2 className="font-[family-name:var(--font-space-mono)] text-4xl md:text-5xl font-bold tracking-[-2px] mb-5 leading-[1.1]">
              Skills have value.<br />So does trust.
            </h2>
            <p className="text-lg text-[#6b7a94] leading-relaxed">
              The $TCLAW token powers the TrustClaw economy — from premium skill access to publisher verification to community governance.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-9">
              <div className="bg-[#0f1420] border border-[#1a2235] rounded-lg p-5 transition-colors hover:border-[#00c2ff]">
                <h4 className="text-sm font-bold mb-1.5 flex items-center gap-2">🔓 Access</h4>
                <p className="text-[13px] text-[#6b7a94] leading-relaxed">Unlock premium verified skills and early releases</p>
              </div>
              <div className="bg-[#0f1420] border border-[#1a2235] rounded-lg p-5 transition-colors hover:border-[#00c2ff]">
                <h4 className="text-sm font-bold mb-1.5 flex items-center gap-2">🛡️ Stake</h4>
                <p className="text-[13px] text-[#6b7a94] leading-relaxed">Publishers stake tokens for Verified badge. Bad actors lose it.</p>
              </div>
              <div className="bg-[#0f1420] border border-[#1a2235] rounded-lg p-5 transition-colors hover:border-[#00c2ff]">
                <h4 className="text-sm font-bold mb-1.5 flex items-center gap-2">🔥 Burn</h4>
                <p className="text-[13px] text-[#6b7a94] leading-relaxed">5% of marketplace fees burned. Supply shrinks with usage.</p>
              </div>
              <div className="bg-[#0f1420] border border-[#1a2235] rounded-lg p-5 transition-colors hover:border-[#00c2ff]">
                <h4 className="text-sm font-bold mb-1.5 flex items-center gap-2">🗳️ Govern</h4>
                <p className="text-[13px] text-[#6b7a94] leading-relaxed">Vote on featured skills, platform rules, and treasury allocation.</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-[family-name:var(--font-space-mono)] text-[120px] font-bold text-[#00e87b] leading-none mb-4" style={{ textShadow: '0 0 80px #00e87b20' }}>
              $M
            </div>
            <div className="font-[family-name:var(--font-jetbrains)] text-sm text-[#3a4560] tracking-[4px]">$TCLAW</div>
            <div className="font-[family-name:var(--font-jetbrains)] text-xs text-[#3a4560] mt-3 py-2 px-4 border border-[#1a2235] rounded inline-block">
              BASE NETWORK · LAUNCHED VIA CLAWNCH
            </div>
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="relative z-10 py-28 px-6 md:px-10 text-center max-w-[800px] mx-auto" id="waitlist">
        <h2 className="font-[family-name:var(--font-space-mono)] text-4xl md:text-6xl font-bold tracking-[-2px] mb-5 leading-[1.1]">
          Ship skills.<br />Not malware.
        </h2>
        <p className="text-lg text-[#6b7a94] mb-10 leading-relaxed">
          TrustClaw launches soon. Join the waitlist to get early access, priority publishing, and founding token allocation.
        </p>
        <div className="flex gap-2 max-w-[480px] mx-auto">
          <input 
            type="email" 
            placeholder="your@email.com"
            className="flex-1 py-3.5 px-5 border border-[#1a2235] rounded-md bg-[#0f1420] text-[#e8ecf4] text-[15px] outline-none transition-colors focus:border-[#00e87b] placeholder:text-[#3a4560]"
          />
          <button className="bg-[#00e87b] text-[#06080c] px-6 py-3.5 rounded-md font-bold text-sm cursor-pointer transition-all hover:shadow-[0_0_30px_#00e87b30] hover:-translate-y-0.5 whitespace-nowrap">
            Get Early Access
          </button>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-[#1a2235] py-10 px-6 md:px-10 relative z-10">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#3a4560]">TrustClaw · by Miyamoto Labs 🔒</span>
          <div className="flex gap-6">
            <a href="#" className="text-[#3a4560] no-underline text-[13px] transition-colors hover:text-[#6b7a94]">GitHub</a>
            <a href="#" className="text-[#3a4560] no-underline text-[13px] transition-colors hover:text-[#6b7a94]">Twitter</a>
            <a href="#" className="text-[#3a4560] no-underline text-[13px] transition-colors hover:text-[#6b7a94]">Docs</a>
            <a href="#" className="text-[#3a4560] no-underline text-[13px] transition-colors hover:text-[#6b7a94]">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
