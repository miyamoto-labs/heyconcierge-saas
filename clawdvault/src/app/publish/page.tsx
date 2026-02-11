"use client";

import Link from "next/link";
import { 
  Upload, 
  Package, 
  DollarSign, 
  CheckCircle, 
  ArrowRight,
  Terminal,
  FileCode,
  Shield,
  Zap
} from "lucide-react";

export default function PublishPage() {
  return (
    <div className="pt-24 pb-16 px-6 md:px-10 max-w-4xl mx-auto relative z-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#00e87b33] rounded bg-[#00e87b22] font-[family-name:var(--font-jetbrains)] text-xs text-[#00e87b] mb-6">
          🚀 Creator Program
        </div>
        <h1 className="font-[family-name:var(--font-space-mono)] text-4xl md:text-5xl font-bold tracking-[-2px] mb-4">
          Publish Your Skill
        </h1>
        <p className="text-[#6b7a94] text-lg max-w-xl mx-auto">
          Turn your OpenClaw integrations into income. Set your price, earn 70% of every sale.
        </p>
      </div>

      {/* Early Access Banner */}
      <div className="bg-[#0f1420] border border-[#00e87b33] rounded-xl p-5 mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-[#00e87b22] rounded-full flex items-center justify-center">
            <Zap className="h-6 w-6 text-[#00e87b]" />
          </div>
          <div>
            <div className="font-semibold text-[#00e87b]">Early Creator Bonus</div>
            <div className="text-sm text-[#6b7a94]">First 50 creators get 100% revenue for 30 days</div>
          </div>
        </div>
        <span className="bg-[#00e87b] text-[#06080c] px-3 py-1 rounded text-xs font-bold">Active</span>
      </div>

      {/* How It Works */}
      <div className="grid md:grid-cols-3 gap-5 mb-12">
        <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6 transition-all hover:border-[#00e87b] hover:-translate-y-0.5">
          <div className="h-12 w-12 bg-[#00e87b22] rounded-lg flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-[#00e87b]" />
          </div>
          <h3 className="font-[family-name:var(--font-space-mono)] text-lg font-bold mb-2">1. Package Your Skill</h3>
          <p className="text-sm text-[#6b7a94] leading-relaxed">
            Create a skill directory with SKILL.md and your code. Can be MCP server, Python scripts, or unbrowse package.
          </p>
        </div>
        <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6 transition-all hover:border-[#00e87b] hover:-translate-y-0.5">
          <div className="h-12 w-12 bg-[#00e87b22] rounded-lg flex items-center justify-center mb-4">
            <Upload className="h-6 w-6 text-[#00e87b]" />
          </div>
          <h3 className="font-[family-name:var(--font-space-mono)] text-lg font-bold mb-2">2. Publish to TrustClaw</h3>
          <p className="text-sm text-[#6b7a94] leading-relaxed">
            Run the publish command or upload via dashboard. We verify your skill and list it in the marketplace.
          </p>
        </div>
        <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6 transition-all hover:border-[#00e87b] hover:-translate-y-0.5">
          <div className="h-12 w-12 bg-[#00e87b22] rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="h-6 w-6 text-[#00e87b]" />
          </div>
          <h3 className="font-[family-name:var(--font-space-mono)] text-lg font-bold mb-2">3. Earn Revenue</h3>
          <p className="text-sm text-[#6b7a94] leading-relaxed">
            Get paid every time someone installs your skill. 70% to you, 30% to platform. Paid in $TCLAW or USDC.
          </p>
        </div>
      </div>

      {/* Publish Methods */}
      <h2 className="font-[family-name:var(--font-space-mono)] text-2xl font-bold mb-6">Choose Your Method</h2>

      <div className="grid md:grid-cols-2 gap-5 mb-12">
        {/* CLI Method */}
        <div className="bg-[#0f1420] border-2 border-[#00e87b] rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#00e87b]" />
          <span className="bg-[#00e87b] text-[#06080c] px-2 py-0.5 rounded text-xs font-bold mb-4 inline-block">Recommended</span>
          <h3 className="font-[family-name:var(--font-space-mono)] text-xl font-bold flex items-center gap-2 mb-2">
            <Terminal className="h-5 w-5" />
            CLI Publish
          </h3>
          <p className="text-sm text-[#6b7a94] mb-4">
            Use the OpenClaw CLI to publish directly from your skill directory
          </p>
          <div className="bg-[#1a2235] p-4 rounded-lg font-[family-name:var(--font-jetbrains)] text-sm mb-4">
            <div className="text-[#3a4560] mb-2"># Navigate to your skill</div>
            <div className="text-[#e8ecf4]">cd ~/.openclaw/skills/my-skill</div>
            <div className="text-[#3a4560] mt-4 mb-2"># Publish to TrustClaw</div>
            <div className="text-[#00e87b]">openclaw trustclaw publish</div>
          </div>
          <p className="text-xs text-[#3a4560]">
            Requires OpenClaw v1.2.0+. The CLI will guide you through pricing and metadata.
          </p>
        </div>

        {/* Unbrowse Method */}
        <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6">
          <span className="bg-[#1a2235] text-[#6b7a94] px-2 py-0.5 rounded text-xs font-medium mb-4 inline-block">For Internal APIs</span>
          <h3 className="font-[family-name:var(--font-space-mono)] text-xl font-bold flex items-center gap-2 mb-2">
            <FileCode className="h-5 w-5" />
            Unbrowse Skill
          </h3>
          <p className="text-sm text-[#6b7a94] mb-4">
            Captured an internal API? Publish it as a reusable skill package
          </p>
          <div className="bg-[#1a2235] p-4 rounded-lg font-[family-name:var(--font-jetbrains)] text-sm mb-4">
            <div className="text-[#3a4560] mb-2"># Publish captured API skill</div>
            <div className="text-[#00e87b]">unbrowse_publish</div>
            <div className="text-[#e8ecf4] mt-2">  --service polymarket</div>
            <div className="text-[#e8ecf4]">  --price 2.99</div>
          </div>
          <p className="text-xs text-[#3a4560]">
            Your captured endpoints become a skill others can install. Auth stays local.
          </p>
        </div>
      </div>

      {/* Skill Structure */}
      <h2 className="font-[family-name:var(--font-space-mono)] text-2xl font-bold mb-6">Skill Structure</h2>
      <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6 mb-12">
        <div className="bg-[#1a2235] p-4 rounded-lg font-[family-name:var(--font-jetbrains)] text-sm overflow-x-auto">
          <pre className="text-[#e8ecf4]">{`my-skill/
├── SKILL.md          # Required: Description, usage, examples
├── package.json      # Optional: For npm-based skills
├── requirements.txt  # Optional: For Python skills
├── src/
│   ├── index.ts      # Main entry point
│   └── handlers/     # Tool implementations
├── auth.json         # Optional: Auth template (no secrets!)
└── README.md         # Optional: Extended documentation`}</pre>
        </div>
        <div className="mt-4 text-sm text-[#6b7a94]">
          <p className="mb-2 font-medium text-[#e8ecf4]">SKILL.md must include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Skill name and description</li>
            <li>Installation requirements</li>
            <li>Usage examples</li>
            <li>Available commands/endpoints</li>
          </ul>
        </div>
      </div>

      {/* Quality Guidelines */}
      <h2 className="font-[family-name:var(--font-space-mono)] text-2xl font-bold mb-6">Quality Guidelines</h2>
      <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6 mb-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-[#00e87b] mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Do
            </h3>
            <ul className="space-y-2 text-sm text-[#6b7a94]">
              <li className="flex items-start gap-2"><span className="text-[#00e87b]">✓</span> Clear, accurate documentation</li>
              <li className="flex items-start gap-2"><span className="text-[#00e87b]">✓</span> Working examples in SKILL.md</li>
              <li className="flex items-start gap-2"><span className="text-[#00e87b]">✓</span> Proper error handling</li>
              <li className="flex items-start gap-2"><span className="text-[#00e87b]">✓</span> Rate limiting for API calls</li>
              <li className="flex items-start gap-2"><span className="text-[#00e87b]">✓</span> Test before publishing</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#ff3b4f] mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Don&apos;t
            </h3>
            <ul className="space-y-2 text-sm text-[#6b7a94]">
              <li className="flex items-start gap-2"><span className="text-[#ff3b4f]">✗</span> Include hardcoded secrets</li>
              <li className="flex items-start gap-2"><span className="text-[#ff3b4f]">✗</span> Claim functionality you don&apos;t have</li>
              <li className="flex items-start gap-2"><span className="text-[#ff3b4f]">✗</span> Copy others&apos; work without credit</li>
              <li className="flex items-start gap-2"><span className="text-[#ff3b4f]">✗</span> Publish malicious code</li>
              <li className="flex items-start gap-2"><span className="text-[#ff3b4f]">✗</span> Break platform ToS</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Revenue Model */}
      <h2 className="font-[family-name:var(--font-space-mono)] text-2xl font-bold mb-6">Revenue Model</h2>
      <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6 mb-12">
        <div className="grid md:grid-cols-3 gap-6 text-center mb-6">
          <div className="p-4 bg-[#1a2235] rounded-lg">
            <div className="font-[family-name:var(--font-space-mono)] text-3xl font-bold text-[#00e87b]">70%</div>
            <div className="text-sm text-[#6b7a94]">Creator Revenue</div>
          </div>
          <div className="p-4 bg-[#1a2235] rounded-lg">
            <div className="font-[family-name:var(--font-space-mono)] text-3xl font-bold text-[#6b7a94]">30%</div>
            <div className="text-sm text-[#6b7a94]">Platform Fee</div>
          </div>
          <div className="p-4 bg-[#1a2235] rounded-lg">
            <div className="font-[family-name:var(--font-space-mono)] text-3xl font-bold text-[#00e87b]">Instant</div>
            <div className="text-sm text-[#6b7a94]">Settlement</div>
          </div>
        </div>
        <p className="text-sm text-[#6b7a94] text-center">
          Paid in $TCLAW tokens (20% bonus) or USDC. Weekly payouts via connected wallet.
        </p>
      </div>

      {/* CTA */}
      <div className="bg-[#0f1420] border border-[#00e87b33] rounded-xl p-8 text-center">
        <h2 className="font-[family-name:var(--font-space-mono)] text-2xl font-bold mb-4">Ready to publish?</h2>
        <p className="text-[#6b7a94] mb-6">
          Run the CLI command in your skill directory to get started
        </p>
        <div className="bg-[#1a2235] py-4 px-6 rounded-lg font-[family-name:var(--font-jetbrains)] text-lg inline-block mb-6">
          <span className="text-[#00e87b]">openclaw trustclaw publish</span>
        </div>
        <div className="flex justify-center gap-4">
          <Link 
            href="/docs/publishing"
            className="border border-[#1a2235] text-[#e8ecf4] px-6 py-2.5 rounded-md font-semibold text-sm no-underline bg-transparent transition-all hover:border-[#00e87b] hover:bg-[#00e87b22]"
          >
            Read the Docs
          </Link>
          <Link 
            href="https://discord.com/invite/trustclaw"
            className="bg-[#00e87b] text-[#06080c] px-6 py-2.5 rounded-md font-bold text-sm no-underline transition-all hover:shadow-[0_0_30px_#00e87b30] hover:-translate-y-0.5 flex items-center gap-2"
          >
            Join Discord for Help
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
