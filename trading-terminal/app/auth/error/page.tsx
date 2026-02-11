"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const errorParam = searchParams.get("error")
    setError(errorParam || "Unknown error")
  }, [searchParams])

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You denied access to your Twitter account.",
    Verification: "The verification token has expired or has already been used.",
    OAuthSignin: "Error in constructing an authorization URL.",
    OAuthCallback: "Error in handling the response from Twitter.",
    OAuthCreateAccount: "Could not create OAuth account.",
    EmailCreateAccount: "Could not create email account.",
    Callback: "Error in the OAuth callback handler route.",
    OAuthAccountNotLinked: "Email on the account is already linked to another account.",
    SessionRequired: "Please sign in to access this page.",
    RefreshAccessTokenError: "Failed to refresh the access token. Please sign in again.",
    Default: "An error occurred during authentication."
  }

  return (
    <div className="max-w-md w-full glass rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
      <p className="text-gray-400 mb-6">
        {errorMessages[error] || errorMessages.Default}
      </p>
      
      <div className="bg-[#050508] border border-white/10 rounded-lg p-3 mb-6">
        <p className="text-xs text-gray-500 mb-1">Error Code:</p>
        <p className="text-sm mono text-red-400">{error}</p>
      </div>

      <div className="space-y-3">
        <a
          href="/"
          className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          Return to Dashboard
        </a>
        
        {error === "RefreshAccessTokenError" && (
          <button
            onClick={() => window.location.href = "/api/auth/signin/twitter"}
            className="block w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Sign In Again
          </button>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <p>If this problem persists, please check:</p>
        <ul className="mt-2 space-y-1 text-left">
          <li>• Twitter API credentials are correct</li>
          <li>• Callback URL is properly configured</li>
          <li>• App has the required scopes enabled</li>
        </ul>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050508] to-[#0a0a12] text-white flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="max-w-md w-full glass rounded-xl p-8 text-center">
          <div className="text-gray-400">Loading error details...</div>
        </div>
      }>
        <ErrorContent />
      </Suspense>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .glass { background: rgba(12, 12, 16, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
      `}</style>
    </div>
  )
}
