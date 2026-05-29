import { NextRequest, NextResponse } from 'next/server';
import { Card } from '@/types';
import { hashCard, getCachedSignal } from '@/lib/cache';
import { generateSignalForCard } from '@/lib/signal-generator';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const MAX_BATCH = 20;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, 'signals-prefetch', 10);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  let body: { cards?: Card[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ queued: 0 });
  }

  const { cards } = body;

  if (!Array.isArray(cards) || cards.length === 0) {
    return NextResponse.json({ queued: 0 });
  }

  const batch = cards.slice(0, MAX_BATCH);
  const uncached = batch.filter((c) => !getCachedSignal(hashCard(c)));

  if (uncached.length === 0) {
    return NextResponse.json({ queued: 0, message: 'all cached' });
  }

  void Promise.allSettled(
    uncached.map((card) => generateSignalForCard(card).catch(() => null))
  );

  return NextResponse.json({ queued: uncached.length });
}
