'use client'

import { FC, ReactNode } from 'react'
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { arbitrum, mainnet, base, optimism, polygon } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '@rainbow-me/rainbowkit/styles.css'

// Configure chains and wallets
const config = getDefaultConfig({
  appName: 'Miyamoto Terminal',
  projectId: 'miyamoto-terminal', // WalletConnect project ID (optional for Rabby/MM)
  chains: [arbitrum, mainnet, base, optimism, polygon],
  ssr: true,
})

const queryClient = new QueryClient()

interface Props {
  children: ReactNode
}

export const WalletProviders: FC<Props> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#00ff88',
            accentColorForeground: 'black',
            borderRadius: 'medium',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
