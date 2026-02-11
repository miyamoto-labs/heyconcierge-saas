import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miyamoto Labs — We Build What Others Can't",
  description: "Software factory powered by autonomous AI agents. We build AI agents, trading bots, security tools, and developer infrastructure.",
  keywords: ["AI agents", "trading bots", "security", "OpenClaw", "autonomous AI", "software factory"],
  authors: [{ name: "Erik Austheim" }],
  openGraph: {
    title: "Miyamoto Labs — We Build What Others Can't",
    description: "Software factory powered by autonomous AI agents.",
    url: "https://miyamotolabs.com",
    siteName: "Miyamoto Labs",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miyamoto Labs",
    description: "Software factory powered by autonomous AI agents.",
    creator: "@miyamotolabs",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-black text-white antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
