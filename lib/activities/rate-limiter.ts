// HeyConcierge OTA Integration — Rate Limiter with Retry + Exponential Backoff
// Respects per-provider API rate limits (Viator and GYG have different limits)

interface RateLimitConfig {
  maxRequestsPerMinute: number
  maxConcurrent: number
  maxRetries: number
  baseDelayMs: number  // base delay for exponential backoff
}

interface QueuedRequest {
  execute: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
  retries: number
}

const PROVIDER_LIMITS: Record<string, RateLimitConfig> = {
  viator: {
    maxRequestsPerMinute: 30,   // Viator Partner API: ~30 req/min
    maxConcurrent: 5,
    maxRetries: 3,
    baseDelayMs: 1000,
  },
  getyourguide: {
    maxRequestsPerMinute: 60,   // GYG Integrator API: ~60 req/min
    maxConcurrent: 10,
    maxRetries: 3,
    baseDelayMs: 500,
  },
}

export class RateLimiter {
  private config: RateLimitConfig
  private requestTimestamps: number[] = []
  private activeRequests = 0
  private queue: QueuedRequest[] = []
  private provider: string

  constructor(provider: string) {
    this.provider = provider
    this.config = PROVIDER_LIMITS[provider] || PROVIDER_LIMITS.viator
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        retries: 0,
      })
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return
    if (this.activeRequests >= this.config.maxConcurrent) return
    if (!this.canMakeRequest()) {
      // Wait until the oldest request expires from the window
      const oldestTimestamp = this.requestTimestamps[0]
      const waitMs = oldestTimestamp ? (oldestTimestamp + 60_000 - Date.now() + 100) : 1000
      setTimeout(() => this.processQueue(), Math.max(100, waitMs))
      return
    }

    const item = this.queue.shift()
    if (!item) return

    this.activeRequests++
    this.recordRequest()

    try {
      const result = await item.execute()
      item.resolve(result)
    } catch (error) {
      const shouldRetry = this.shouldRetry(error, item.retries)

      if (shouldRetry && item.retries < this.config.maxRetries) {
        const delay = this.getBackoffDelay(item.retries)
        console.warn(
          `[${this.provider}] Request failed (attempt ${item.retries + 1}/${this.config.maxRetries}), retrying in ${delay}ms:`,
          error instanceof Error ? error.message : error,
        )
        item.retries++
        setTimeout(() => {
          this.queue.unshift(item) // Put back at front of queue
          this.processQueue()
        }, delay)
      } else {
        item.reject(error)
      }
    } finally {
      this.activeRequests--
      // Process next item
      this.processQueue()
    }
  }

  private canMakeRequest(): boolean {
    this.cleanupTimestamps()
    return this.requestTimestamps.length < this.config.maxRequestsPerMinute
  }

  private recordRequest(): void {
    this.requestTimestamps.push(Date.now())
  }

  private cleanupTimestamps(): void {
    const cutoff = Date.now() - 60_000
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff)
  }

  private shouldRetry(error: unknown, _attempt: number): boolean {
    if (error instanceof Error) {
      const msg = error.message
      // Retry on rate limit (429), server errors (5xx), timeouts
      if (msg.includes('429') || msg.includes('rate limit')) return true
      if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) return true
      if (msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('ECONNRESET')) return true
    }
    return false
  }

  private getBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter: base * 2^attempt + random jitter
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, attempt)
    const jitter = Math.random() * this.config.baseDelayMs * 0.5
    return Math.min(exponentialDelay + jitter, 30_000) // Cap at 30 seconds
  }
}

// Singleton instances per provider
const limiters = new Map<string, RateLimiter>()

export function getRateLimiter(provider: string): RateLimiter {
  if (!limiters.has(provider)) {
    limiters.set(provider, new RateLimiter(provider))
  }
  return limiters.get(provider)!
}
