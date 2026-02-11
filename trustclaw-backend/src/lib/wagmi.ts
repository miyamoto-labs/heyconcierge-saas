'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'TrustClaw',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'trustclaw-dev',
  chains: [base],
  ssr: true,
})

// Helper to truncate wallet addresses
export function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Check if an address is the admin wallet
export function isAdminWallet(address: string | undefined): boolean {
  if (!address) return false
  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()
  const adminWallets = process.env.NEXT_PUBLIC_ADMIN_WALLETS?.toLowerCase().split(',') || []
  
  const lowerAddress = address.toLowerCase()
  return lowerAddress === adminWallet || adminWallets.includes(lowerAddress)
}
