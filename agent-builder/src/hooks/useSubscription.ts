'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

type Subscription = {
  plan: 'free' | 'pro' | 'team'
  status: string
  currentPeriodEnd?: string
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription>({ plan: 'free', status: 'active' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSubscription({ plan: 'free', status: 'active' })
      setLoading(false)
      return
    }
    fetch(`/api/subscription?userId=${user.id}`)
      .then(r => r.json())
      .then(data => setSubscription(data))
      .catch(() => setSubscription({ plan: 'free', status: 'active' }))
      .finally(() => setLoading(false))
  }, [user])

  const isPro = subscription.plan === 'pro' || subscription.plan === 'team'
  const isTeam = subscription.plan === 'team'

  return { subscription, loading, isPro, isTeam }
}
