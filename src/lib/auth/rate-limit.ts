/**
 * In-process fixed-window limiter. Good enough for one or two tasks;
 * replace with a shared store (e.g. ElastiCache) before scaling out (ADR 0004).
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string, now = Date.now()): { allowed: boolean; retryAfterMs: number } {
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }
    entry.count += 1;
    return entry.count <= limit
      ? { allowed: true, retryAfterMs: 0 }
      : { allowed: false, retryAfterMs: entry.resetAt - now };
  };
}
