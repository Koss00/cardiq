import { NextRequest, NextResponse } from 'next/server';
import { sweepAllSignals } from '@/lib/signal-sweep';

// Nightly proactive signal recompute. Triggered by GitHub Actions (signal-sweep.yml)
// after the price refresh, so price history is fresh. Same auth as /api/price-refresh.
export const maxDuration = 300; // sweeps make one Claude call per card — give it room

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.PRICE_REFRESH_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sweepAllSignals();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[signal-sweep] failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Sweep failed' }, { status: 500 });
  }
}
