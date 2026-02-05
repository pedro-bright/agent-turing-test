/**
 * Simple in-memory rate limiter for Vercel serverless.
 * Not perfect (doesn't share state across instances), but good enough
 * to prevent casual abuse. For production, use Vercel KV or Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a key.
 * @param key - Unique identifier (IP, token, etc.)
 * @param limit - Max requests per window
 * @param windowMs - Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  entry.count++;
  if (entry.count > limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetAt };
  }

  return { success: true, limit, remaining: limit - entry.count, reset: entry.resetAt };
}

/**
 * Get client identifier from request headers.
 * Uses X-Forwarded-For (Vercel provides this) or falls back to a hash.
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
