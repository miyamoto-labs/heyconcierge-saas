import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "MIYAMOTO LABS — Agent Command Center",
  description: "Agent Management Dashboard for Miyamoto Labs. Monitor and manage your AI agent fleet.",
  openGraph: {
    title: "MIYAMOTO LABS — Agent Command Center",
    description: "Monitor and manage your AI agent fleet in real-time.",
    url: "https://agent-dashboard-six-ruddy.vercel.app",
    siteName: "Miyamoto Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MIYAMOTO LABS — Agent Command Center",
    description: "Monitor and manage your AI agent fleet in real-time.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dark-bg">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
