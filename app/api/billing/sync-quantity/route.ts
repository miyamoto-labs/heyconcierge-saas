import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { syncSubscriptionQuantity } from '@/lib/stripe/sync-quantity'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user || !org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await syncSubscriptionQuantity(org.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sync quantity error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync quantity' },
      { status: 500 }
    )
  }
}
