"use client";

import Link from "next/link";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <nav className="fixed top-0 w-full z-50 px-6 md:px-10 py-4 flex justify-between items-center backdrop-blur-xl bg-[#06080c]/80 border-b border-[#1a2235]">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 border-2 border-[#00e87b] rounded-md flex items-center justify-center text-base bg-[#00e87b22] shadow-[0_0_40px_#00e87b15,0_0_80px_#00e87b08]">
          🔒
        </div>
        <span className="font-[family-name:var(--font-space-mono)] font-bold text-xl tracking-tight text-[#e8ecf4]">
          TrustClaw
        </span>
      </Link>
      
      <div className="flex items-center gap-8">
        <Link 
          href="/skills" 
          className="hidden md:block text-[#6b7a94] no-underline text-sm font-medium tracking-wide hover:text-[#e8ecf4] transition-colors"
        >
          Skills
        </Link>
        <Link 
          href="#security" 
          className="hidden md:block text-[#6b7a94] no-underline text-sm font-medium tracking-wide hover:text-[#e8ecf4] transition-colors"
        >
          Security
        </Link>
        <Link 
          href="#token" 
          className="hidden md:block text-[#6b7a94] no-underline text-sm font-medium tracking-wide hover:text-[#e8ecf4] transition-colors"
        >
          $TCLAW
        </Link>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="bg-[#00e87b] text-[#06080c] px-6 py-2.5 rounded-md font-bold text-sm cursor-pointer transition-all hover:shadow-[0_0_30px_#00e87b30] hover:-translate-y-0.5"
                      >
                        Get Early Access
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      className="border border-[#1a2235] text-[#e8ecf4] px-4 py-2 rounded-md font-semibold text-sm bg-transparent cursor-pointer transition-all hover:border-[#00e87b] hover:bg-[#00e87b22]"
                    >
                      {account.displayName}
                    </button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
}
