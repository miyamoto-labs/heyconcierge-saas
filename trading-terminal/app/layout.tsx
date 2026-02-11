import type { Metadata } from "next"
import { Providers } from "./providers"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Miyamoto Terminal | By Miyamoto Labs",
  description: "AI-powered crypto trading terminal with real-time data, news, and community chat",
  openGraph: {
    title: "Miyamoto Terminal | By Miyamoto Labs",
    description: "AI-powered crypto trading terminal with real-time data, news, and community chat.",
    url: "https://trading-terminal-two.vercel.app",
    siteName: "Miyamoto Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miyamoto Terminal",
    description: "AI-powered crypto trading terminal with real-time data, news, and community chat.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
