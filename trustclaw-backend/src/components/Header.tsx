'use client'

import Link from 'next/link'
import { Shield, Search, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import WalletButton from './wallet-button'
import { isAdminWallet } from '@/lib/wagmi'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const isAdmin = isAdminWallet(address)

  return (
    <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-trust-green" />
            <span className="text-xl font-bold">
              Trust<span className="text-trust-green">Claw</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/skills" 
              className="text-dark-muted hover:text-white transition-colors"
            >
              Browse Skills
            </Link>
            <Link 
              href="/submit" 
              className="text-dark-muted hover:text-white transition-colors"
            >
              Submit Skill
            </Link>
            <Link 
              href="/docs" 
              className="text-dark-muted hover:text-white transition-colors"
            >
              Docs
            </Link>
            {isConnected && (
              <Link 
                href="/profile" 
                className="text-dark-muted hover:text-white transition-colors"
              >
                Profile
              </Link>
            )}
            {isConnected && isAdmin && (
              <Link 
                href="/admin" 
                className="text-trust-green hover:text-trust-green-light transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Search & Wallet */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Search skills..."
                className="input pl-10 w-64"
              />
            </div>
            <WalletButton />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-border">
            <div className="flex flex-col gap-4">
              <Link 
                href="/skills" 
                className="text-dark-muted hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Skills
              </Link>
              <Link 
                href="/submit" 
                className="text-dark-muted hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Submit Skill
              </Link>
              <Link 
                href="/docs" 
                className="text-dark-muted hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              {isConnected && (
                <Link 
                  href="/profile" 
                  className="text-dark-muted hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              )}
              {isConnected && isAdmin && (
                <Link 
                  href="/admin" 
                  className="text-trust-green hover:text-trust-green-light transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <div className="pt-2">
                <WalletButton />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
