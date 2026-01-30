/**
 * In-memory rate limiter for API routes.
 * Per-instance only (serverless: each instance has its own store).
 * For cross-instance limits, use Redis (e.g. Upstash) instead.
 */

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

const DEFAULT_MAX = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Check and consume one request for the given key.
 * Returns true if under limit, false if over limit.
 */
export function checkRateLimit(
  key: string,
  max: number = DEFAULT_MAX,
  windowMs: number = DEFAULT_WINDOW_MS
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, resetInMs: windowMs };
  }

  const elapsed = now - entry.windowStart;
  if (elapsed >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, resetInMs: windowMs };
  }

  entry.count += 1;
  if (entry.count > max) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, windowMs - elapsed),
    };
  }

  return {
    allowed: true,
    remaining: max - entry.count,
    resetInMs: Math.max(0, windowMs - elapsed),
  };
}

/** Get client IP from request (for optional IP-based limiting). */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(',')[0]?.trim() ?? 'unknown';
  }
  const real = req.headers['x-real-ip'];
  if (real) {
    return Array.isArray(real) ? real[0] : real;
  }
  return req.socket?.remoteAddress ?? 'unknown';
}
