// ─── eBay Intelligence Utilities ─────────────────────────────────────────────
// Extracts velocity, trend, and liquidity signals from raw eBay comp data.

export interface EbayIntel {
  avg: number;
  count: number;
  min: number;
  max: number;
  spreadPct: number;              // (max-min)/avg*100 — liquidity proxy
  priceTrend: 'rising' | 'falling' | 'flat'; // price distribution skew
  recentFraction: number;         // fraction of items listed in last 72h (0-1)
  velocityPerDay: number | null;  // avg new listings per day over sample window
  lastListedDaysAgo: number | null; // how stale is the most recent comp
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function buildEbayIntel(
  items: Array<{ price: number; listedAt?: string }>
): EbayIntel | null {
  const valid = items.filter((i) => i.price > 0);
  if (valid.length === 0) return null;

  const prices = valid.map((i) => i.price);
  const avg = mean(prices);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spreadPct = avg > 0 ? ((max - min) / avg) * 100 : 0;

  // Price trend: compare first-half vs second-half of price-sorted comps
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const firstHalf  = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  const firstAvg   = mean(firstHalf);
  const secondAvg  = mean(secondHalf);
  let priceTrend: 'rising' | 'falling' | 'flat' = 'flat';
  if (firstHalf.length > 0 && secondHalf.length > 0 && firstAvg > 0) {
    const diff = (secondAvg - firstAvg) / firstAvg;
    if (diff > 0.05)       priceTrend = 'rising';
    else if (diff < -0.05) priceTrend = 'falling';
  }

  // Recency calculations
  const now = Date.now();
  const THREE_DAYS_MS = 72 * 60 * 60 * 1000;

  const datedItems = valid.filter((i) => !!i.listedAt);
  let recentFraction = 0;
  let velocityPerDay: number | null = null;
  let lastListedDaysAgo: number | null = null;

  if (datedItems.length > 0) {
    const timestamps = datedItems
      .map((i) => new Date(i.listedAt!).getTime())
      .filter((t) => !isNaN(t));

    if (timestamps.length > 0) {
      const recentCount = timestamps.filter((t) => now - t <= THREE_DAYS_MS).length;
      recentFraction = recentCount / valid.length;

      const newestTs = Math.max(...timestamps);
      const oldestTs = Math.min(...timestamps);
      lastListedDaysAgo = (now - newestTs) / (24 * 60 * 60 * 1000);

      if (timestamps.length >= 2) {
        const spanDays = (newestTs - oldestTs) / (24 * 60 * 60 * 1000);
        if (spanDays >= 0.5) {
          velocityPerDay = (timestamps.length - 1) / spanDays;
        }
      }
    }
  }

  return {
    avg,
    count: valid.length,
    min,
    max,
    spreadPct,
    priceTrend,
    recentFraction,
    velocityPerDay,
    lastListedDaysAgo: lastListedDaysAgo !== null ? Math.round(lastListedDaysAgo * 10) / 10 : null,
  };
}

export function formatEbayContext(intel: EbayIntel | null, priceHistoryLen: number, priceHistoryFirst?: number, priceHistoryLast?: number): string {
  const parts: string[] = [];

  if (intel) {
    parts.push(
      `eBay comps (${intel.count} listings): avg $${intel.avg.toFixed(0)}, range $${intel.min.toFixed(0)}–$${intel.max.toFixed(0)}, spread ${intel.spreadPct.toFixed(0)}%`
    );
    const recencyStr = intel.recentFraction > 0
      ? `, ${(intel.recentFraction * 100).toFixed(0)}% listed in last 3 days`
      : '';
    const velocityStr = intel.velocityPerDay !== null
      ? `, ${intel.velocityPerDay.toFixed(1)} new/day`
      : '';
    parts.push(`Market velocity: trend=${intel.priceTrend}${recencyStr}${velocityStr}`);
  }

  if (priceHistoryLen >= 2 && priceHistoryFirst !== undefined && priceHistoryLast !== undefined) {
    const pct = (((priceHistoryLast - priceHistoryFirst) / priceHistoryFirst) * 100).toFixed(1);
    parts.push(`Price history (${priceHistoryLen} pts): $${priceHistoryFirst.toFixed(0)} → $${priceHistoryLast.toFixed(0)} (${pct}% over tracked period)`);
  } else if (priceHistoryLen === 0 && !intel) {
    return 'No market data available.';
  }

  return parts.join('\n');
}
