import { requireAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PlatformRating {
  id: string
  org_id: string
  user_id: string | null
  rating: number
  comment: string | null
  created_at: string
  org_name?: string
}

export default async function AdminReviewsPage() {
  const session = await requireAdminSession()
  if (!session) redirect('/admin/login')

  const { getAdminSupabase } = await import('@/lib/admin-auth')
  const supabase = getAdminSupabase()

  // Fetch all platform ratings
  const { data: ratings } = await supabase
    .from('platform_ratings')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch org names for display
  const orgIds = Array.from(new Set((ratings || []).map((r: PlatformRating) => r.org_id)))
  let orgMap: Record<string, string> = {}
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds)
    if (orgs) {
      orgMap = Object.fromEntries(orgs.map((o: { id: string; name: string }) => [o.id, o.name]))
    }
  }

  const enrichedRatings: PlatformRating[] = (ratings || []).map((r: PlatformRating) => ({
    ...r,
    org_name: orgMap[r.org_id] || 'Unknown',
  }))

  // Stats
  const totalCount = enrichedRatings.length
  const avgRating = totalCount > 0
    ? Math.round((enrichedRatings.reduce((s, r) => s + r.rating, 0) / totalCount) * 10) / 10
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: enrichedRatings.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold">Platform Reviews</h1>
        <p className="text-slate-400 text-sm mt-1">
          Ratings from hosts about the HeyConcierge platform
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Total Reviews</p>
          <p className="text-3xl font-bold text-white tabular-nums">{totalCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Average Rating</p>
          <p className={`text-3xl font-bold tabular-nums ${avgRating >= 4 ? 'text-emerald-400' : avgRating >= 3 ? 'text-amber-400' : 'text-white'}`}>
            {avgRating > 0 ? `${avgRating} / 5` : '-'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Distribution</p>
          <div className="space-y-1.5">
            {ratingDistribution.map(({ star, count }) => {
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 w-3">{star}</span>
                  <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#334155' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: '#facc15', minWidth: count > 0 ? '4px' : '0px' }}
                    />
                  </div>
                  <span className="text-slate-500 w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      {enrichedRatings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400 text-sm">No platform reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enrichedRatings.map((review) => (
            <div
              key={review.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white text-sm font-medium">{review.org_name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-slate-700'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-white text-sm font-bold ml-1">{review.rating}</span>
                </div>
              </div>
              {review.comment && (
                <p className="text-slate-300 text-sm mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
