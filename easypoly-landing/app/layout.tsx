import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyPoly — AI-Powered Polymarket Picks in Telegram",
  description:
    "AI scans 300+ Polymarket markets daily and delivers the best mispricings to your Telegram. One tap to bet.",
  openGraph: {
    title: "EasyPoly — Polymarket in Your Pocket",
    description:
      "AI finds the edge. You tap the button. 2-3 picks daily delivered to Telegram.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-brand-dark text-white antialiased">{children}</body>
    </html>
  );
}
