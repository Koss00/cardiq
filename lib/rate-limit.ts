interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Prune expired entries every 60s to prevent unbounded growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, 60_000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms until window resets
}

export function checkRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowMs = 60_000,
): RateLimitResult {
  const key = `${endpoint}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetIn = entry.resetAt - now;

  return { allowed: entry.count <= maxRequests, remaining, resetIn };
}

export function rateLimitResponse(resetIn: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(resetIn / 1000)),
      },
    },
  );
}
