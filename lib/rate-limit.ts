import sql from './db';
import { initSchema } from './db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms until window resets
}

/**
 * Persistent DB-backed rate limiter that survives Vercel cold starts.
 * Uses an atomic upsert so concurrent requests stay consistent.
 */
export async function checkRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const key      = `${endpoint}:${ip}`;
  const resetAt  = new Date(Date.now() + windowMs).toISOString();

  try {
    await initSchema();
    const rows = await sql`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, ${resetAt}::timestamptz)
      ON CONFLICT (key) DO UPDATE SET
        count    = CASE
                     WHEN rate_limits.reset_at <= NOW() THEN 1
                     ELSE rate_limits.count + 1
                   END,
        reset_at = CASE
                     WHEN rate_limits.reset_at <= NOW() THEN ${resetAt}::timestamptz
                     ELSE rate_limits.reset_at
                   END
      RETURNING count, CEIL(EXTRACT(EPOCH FROM (reset_at - NOW())) * 1000) AS reset_in_ms
    `;

    const count      = rows[0].count as number;
    const resetInMs  = Math.max(0, Number(rows[0].reset_in_ms));
    const remaining  = Math.max(0, maxRequests - count);

    return { allowed: count <= maxRequests, remaining, resetIn: resetInMs };
  } catch {
    // Fail open — never block a request because the rate limit table is unavailable
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
}

export function rateLimitResponse(resetIn: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type':  'application/json',
        'Retry-After':   String(Math.ceil(resetIn / 1000)),
      },
    },
  );
}
