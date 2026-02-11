import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://trustclaw.xyz";

export const metadata: Metadata = {
  title: "TrustClaw - Security-Verified Skill Marketplace",
  description: "The trust layer for AI agent skills. Every skill verified. Every agent secure.",
  icons: {
    icon: "/favicon.svg",
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "TrustClaw - Security-Verified Skill Marketplace",
    description: "The trust layer for AI agent skills. Every skill verified. Every agent secure.",
    url: siteUrl,
    siteName: "TrustClaw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustClaw - Security-Verified Skill Marketplace",
    description: "The trust layer for AI agent skills. Every skill verified. Every agent secure.",
    creator: "@trustclawai",
    site: "@trustclawai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-dark-bg">
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
