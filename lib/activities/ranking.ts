// HeyConcierge OTA Integration — Activity Ranking
// Normalizes and ranks results from multiple providers for best guest experience

import type { Activity } from './types'

interface ScoredActivity extends Activity {
  _score: number
}

// Rank activities by composite score: rating, reviews, price, relevance
export function rankActivities(activities: Activity[], query?: string): Activity[] {
  if (activities.length === 0) return []

  const scored: ScoredActivity[] = activities.map((a) => ({
    ...a,
    _score: computeScore(a, query),
  }))

  scored.sort((a, b) => b._score - a._score)

  return scored.map(({ _score, ...activity }) => activity)
}

function computeScore(activity: Activity, query?: string): number {
  let score = 0

  // Rating weight (0-50 points)
  if (activity.rating) {
    score += activity.rating * 10 // max 50 for 5.0 rating
  } else {
    score += 25 // neutral score for unrated
  }

  // Review volume (0-20 points, logarithmic)
  if (activity.reviewCount > 0) {
    score += Math.min(20, Math.log10(activity.reviewCount) * 7)
  }

  // Price competitiveness (0-15 points, cheaper = more points)
  if (activity.price.amount > 0) {
    if (activity.price.amount < 30) score += 15
    else if (activity.price.amount < 60) score += 12
    else if (activity.price.amount < 100) score += 8
    else if (activity.price.amount < 200) score += 4
  }

  // Query relevance (0-15 points)
  if (query) {
    score += computeRelevance(activity, query) * 15
  }

  return score
}

function computeRelevance(activity: Activity, query: string): number {
  const q = query.toLowerCase()
  const tokens = q.split(/\s+/).filter((t) => t.length > 2)
  const searchableText = [
    activity.name,
    activity.description,
    activity.shortDescription,
    activity.category,
    ...(activity.highlights || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (tokens.length === 0) return 0.5

  let matchCount = 0
  for (const token of tokens) {
    if (searchableText.includes(token)) matchCount++
  }

  return matchCount / tokens.length
}

// Deduplicate activities across providers (same activity listed on both GYG + Viator)
export function deduplicateActivities(activities: Activity[]): Activity[] {
  const seen = new Map<string, Activity>()

  for (const activity of activities) {
    // Create a fingerprint from name similarity
    const key = normalizeForDedup(activity.name)

    if (seen.has(key)) {
      const existing = seen.get(key)!
      // Keep the one with more reviews (likely more reliable data)
      if (activity.reviewCount > existing.reviewCount) {
        seen.set(key, activity)
      }
    } else {
      seen.set(key, activity)
    }
  }

  return Array.from(seen.values())
}

function normalizeForDedup(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .sort()
    .slice(0, 5) // First 5 sorted words as fingerprint
    .join(' ')
}
