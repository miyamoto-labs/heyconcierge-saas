'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccessPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check password
    const validPassword = process.env.NEXT_PUBLIC_ACCESS_CODE || 'heyc2026'
    
    if (password === validPassword) {
      // Set cookie and redirect
      document.cookie = `heyconcierge_access=${password}; path=/; max-age=86400` // 24 hours
      router.push('/')
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hey Concierge
          </h1>
          <p className="text-gray-600">
            Enter access code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Access Code
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter access code"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">
                Invalid access code. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Access Site
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Private beta testing · Limited access
          </p>
        </div>
      </div>
    </div>
  )
}
