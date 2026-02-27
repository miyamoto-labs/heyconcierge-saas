/**
 * Simple in-memory IP-based rate limiter.
 * For production with multiple instances, replace with Redis-backed solution.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number
  /** Window size in seconds */
  windowSeconds: number
}

export function checkRateLimit(
  ip: string,
  prefix: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number } {
  const key = `${prefix}:${ip}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 })
    return { allowed: true, remaining: config.limit - 1 }
  }

  entry.count++
  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: config.limit - entry.count }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return '127.0.0.1'
}
