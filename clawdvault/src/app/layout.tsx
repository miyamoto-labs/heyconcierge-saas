import type { Metadata } from "next";
import { Space_Mono, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { WalletProvider } from "@/components/providers/WalletProvider";

const spaceMono = Space_Mono({ 
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: '--font-space-mono',
});

const jetbrainsMono = JetBrains_Mono({ 
  weight: ['400', '500'],
  subsets: ["latin"],
  variable: '--font-jetbrains',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "TrustClaw | The Safe Side of OpenClaw",
  description: "Curated, security-verified skills for your AI agent. Every skill scanned. Every publisher verified. Zero malware.",
  keywords: ["AI agents", "OpenClaw", "skills", "security", "marketplace", "verified", "trusted"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${jetbrainsMono.variable} ${inter.variable}`}>
      <body className={`${inter.className} bg-[#06080c] text-[#e8ecf4] min-h-screen antialiased`}>
        <WalletProvider>
          <div className="grid-bg" />
          <Header />
          <main className="relative z-10">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
