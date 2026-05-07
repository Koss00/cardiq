import { NextRequest, NextResponse } from 'next/server';
import { Card } from '@/types';
import { hashCard, getCachedSignal } from '@/lib/cache';
import { generateSignalForCard } from '@/lib/signal-generator';

export async function POST(req: NextRequest) {
  const { cards }: { cards: Card[] } = await req.json();

  if (!cards?.length) {
    return NextResponse.json({ queued: 0 });
  }

  // Only generate for cards whose cache entry is missing or stale
  const uncached = cards.filter((c) => !getCachedSignal(hashCard(c)));

  if (uncached.length === 0) {
    return NextResponse.json({ queued: 0, message: 'all cached' });
  }

  // Fire background generation — do NOT await, return immediately
  void Promise.allSettled(
    uncached.map((card) => generateSignalForCard(card).catch(() => null))
  );

  return NextResponse.json({ queued: uncached.length });
}
