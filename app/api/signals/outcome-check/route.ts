import { NextRequest, NextResponse } from 'next/server';
import {
  dbGetPendingOutcomes, dbRecordOutcome, dbGetPriceHistory, initSchema,
} from '@/lib/db';

const SECRET = process.env.PRICE_REFRESH_SECRET ?? '';

export async function POST(req: NextRequest) {
  // Bearer token auth (same pattern as price-refresh)
  const auth = req.headers.get('authorization') ?? '';
  if (!SECRET || auth !== `Bearer ${SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initSchema().catch(() => {});

  const pending = await dbGetPendingOutcomes(7, 45).catch(() => []);
  let checked = 0;

  for (const row of pending) {
    try {
      // Reconstruct the eBay query key from the stored player info
      // We don't store the full query in card_signals, so we look it up from
      // price_history using the card_hash as a proxy via the player name
      // Best effort: search price history for keys matching player name
      const queryKey = `history:${row.player}`;
      const history  = await dbGetPriceHistory(queryKey).catch(() => []);

      if (history.length === 0) continue;

      const currentPrice = history[history.length - 1].price;
      const signalPrice  = row.priceTarget; // what the signal predicted as target

      if (!signalPrice || signalPrice <= 0 || currentPrice <= 0) continue;

      // Use the price at the time of signal generation as baseline
      // outcomePct = how much the current price diverged from the priceTarget
      // We measure: did the price move in the direction the signal predicted?
      const outcomePct = ((currentPrice - signalPrice) / signalPrice) * 100;

      let correct: boolean;
      switch (row.signal) {
        case 'BUY':
          // BUY is correct if price moved toward or past target (within -5%)
          correct = outcomePct >= -5;
          break;
        case 'SELL':
          // SELL is correct if price stayed flat or fell (within +5% of target)
          correct = outcomePct <= 5;
          break;
        case 'HOLD':
          // HOLD is correct if price stayed stable (<10% either direction)
          correct = Math.abs(outcomePct) < 10;
          break;
        default:
          continue;
      }

      await dbRecordOutcome(row.id!, currentPrice, outcomePct, correct);
      checked++;
    } catch (err) {
      console.warn(`[outcome-check] failed for signal ${row.id}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`[outcome-check] processed ${checked} of ${pending.length} pending signals`);
  return NextResponse.json({ checked, pending: pending.length });
}
