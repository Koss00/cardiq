// ─── eBay Intelligence Utilities ─────────────────────────────────────────────
// Extracts velocity, trend, and liquidity signals from raw eBay comp data.

// ─── Finding API (Real Sold Prices) ──────────────────────────────────────────

const FINDING_API = 'https://svcs.ebay.com/services/search/FindingService/v1';

export interface SoldListing {
  title: string;
  price: number;
  url: string;
  imageUrl?: string;
  soldDate?: string;  // human-readable: "Jun 1, 2026"
  listedAt?: string;  // ISO 8601 — used by buildEbayIntel for recency math
}

/**
 * Build progressive query fallbacks from most specific → most general.
 * The Finding API often returns 0 results for highly-specific queries, so we
 * progressively strip grade → serial → variation until we find sold comps.
 *
 * Final fallback is always "YEAR FIRSTNAME LASTNAME" extracted from the
 * cleaned query — guaranteed to find SOMETHING for any real player card.
 */
/**
 * @param query   The cleaned eBay search query.
 * @param player  Optional player name. When provided the last-resort fallback
 *                is "YEAR PLAYER" which is reliable. Without it the heuristic
 *                (last 2 tokens) can accidentally include variation words.
 */
export function buildFindingQueryFallbacks(query: string, player?: string): string[] {
  const fallbacks: string[] = [query];

  // 1. Strip grade suffix (PSA 10, PSA 9, BGS 9.5, SGC 10, etc.)
  const noGrade = query.replace(/\s+(PSA|BGS|SGC)\s+\d+(\.\d+)?\s*$/i, '').trim();
  if (noGrade !== query) fallbacks.push(noGrade);

  // 2. Strip print-run serial ("/149", "/25") from the end
  const prev = fallbacks[fallbacks.length - 1];
  const noSerial = prev.replace(/\s+\/\d+\s*$/, '').trim();
  if (noSerial !== prev) fallbacks.push(noSerial);

  // 3. Last resort: year + player name.
  //    When the player name is known use it directly — avoids the "last 2 tokens"
  //    heuristic accidentally picking up variation words (e.g. "Underwood SILVER").
  const year = query.split(/\s+/)[0] ?? '';
  if (player && year) {
    const yearPlayer = `${year} ${player}`;
    if (!fallbacks.includes(yearPlayer)) fallbacks.push(yearPlayer);
  } else {
    // Heuristic when player not available: last 2 tokens of cleaned query.
    // Works for most cards (e.g. "2025 Panini Prizm Black Bryce Underwood" → "2025 Bryce Underwood")
    const base   = fallbacks[fallbacks.length - 1];
    const tokens = base.split(/\s+/);
    if (tokens.length >= 3) {
      const yearPlayer = `${tokens[0]} ${tokens.slice(-2).join(' ')}`;
      if (!fallbacks.includes(yearPlayer)) fallbacks.push(yearPlayer);
    }
  }

  return [...new Set(fallbacks)]; // deduplicate, preserve specificity order
}

async function tryFindingAPIOnce(query: string, appId: string): Promise<SoldListing[]> {
  const params = new URLSearchParams({
    'OPERATION-NAME':                 'findCompletedItems',
    'SERVICE-VERSION':                '1.13.0',
    'SECURITY-APPNAME':               appId,
    'RESPONSE-DATA-FORMAT':           'JSON',
    'keywords':                       query,
    'itemFilter(0).name':             'SoldItemsOnly',
    'itemFilter(0).value':            'true',
    'sortOrder':                      'EndTimeSoonest',
    'paginationInput.entriesPerPage': '10',
  });

  const res = await fetch(`${FINDING_API}?${params.toString()}`, { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = await res.json() as Record<string, unknown>;
  const searchResult = (data.findCompletedItemsResponse as Record<string, unknown>[])?.[0];
  if ((searchResult?.ack as string[])?.[0] !== 'Success') return [];

  const rawItems = (
    (searchResult?.searchResult as Record<string, unknown>[])?.[0]?.item as Record<string, unknown>[]
  ) ?? [];

  return rawItems.map((item) => {
    const sellingStatus = (item.sellingStatus as Record<string, unknown>[])?.[0];
    const priceVal      = (sellingStatus?.convertedCurrentPrice as Record<string, string>[])?.[0]?.__value__;
    const price         = parseFloat(priceVal ?? '0');
    const galleryURL    = (item.galleryURL as string[])?.[0];
    const viewItemURL   = (item.viewItemURL as string[])?.[0];
    const title         = (item.title as string[])?.[0] ?? '';
    const endTimeRaw    = (item.listingInfo as Record<string, unknown>[])?.[0]?.endTime as string[] | undefined;
    const endTimeStr    = endTimeRaw?.[0]; // ISO 8601 string
    return {
      title,
      price,
      url:      viewItemURL ?? '',
      imageUrl: galleryURL,
      soldDate: endTimeStr
        ? new Date(endTimeStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : undefined,
      listedAt: endTimeStr, // ISO — keeps recency math accurate in buildEbayIntel
    };
  }).filter((l) => l.price > 0);
}

/**
 * Fetch real sold comps from eBay Finding API with progressive query fallback.
 *
 * Tries queries from most specific to most general until results are found.
 * Returns the first non-empty result set, or null if nothing found / API down.
 */
export async function fetchFindingSold(query: string, appId: string, player?: string): Promise<SoldListing[] | null> {
  const queries = buildFindingQueryFallbacks(query, player);
  for (const q of queries) {
    try {
      const listings = await tryFindingAPIOnce(q, appId);
      if (listings.length > 0) {
        if (q !== query) {
          console.log(`[finding-api] ${listings.length} sold comps for "${q}" (simplified from "${query}")`);
        } else {
          console.log(`[finding-api] ${listings.length} sold comps for "${q}"`);
        }
        return listings;
      }
    } catch (err) {
      console.warn(`[finding-api] error for "${q}":`, err instanceof Error ? err.message : String(err));
    }
  }
  console.log(`[finding-api] 0 sold comps after all fallbacks for "${query}"`);
  return null;
}

/**
 * Builds a clean eBay search query from card fields.
 *
 * Removes noise that hurts keyword matching:
 *  - "Numbered" is redundant (the /N serial already implies it)
 *  - Duplicate set name words (e.g. "Prizm" appears in both "Panini Prizm Black"
 *    and "Prizm Silver /175" — eBay treats this as a stricter filter)
 */
export function buildEbayQuery(
  year: number | string,
  brand: string,
  player: string,
  variation?: string,
  condition?: string,
): string {
  let varPart = (variation ?? '').trim();

  // Strip specific copy serial "(097/175)" — this is the collector's individual card number,
  // not the print run. Including it makes the query unique to one listing and returns nothing.
  varPart = varPart.replace(/\s*\(\d+\/\d+\)/g, '').trim();

  // Strip noise words that hurt eBay keyword matching
  varPart = varPart.replace(/\bNumbered\b/gi, '').trim();
  varPart = varPart.replace(/\bSerial\b/gi, '').trim();

  // Strip commas — eBay keyword search doesn't use comma syntax
  varPart = varPart.replace(/,/g, ' ').trim();

  // Collapse multiple spaces left behind
  varPart = varPart.replace(/\s{2,}/g, ' ').trim();

  // Remove leading variation word if it already appears in the brand
  // e.g. brand="Panini Prizm Black", variation="Prizm /175" → "/175"
  if (varPart) {
    const brandLower = brand.toLowerCase();
    const firstVarWord = varPart.split(/\s+/)[0];
    if (firstVarWord && brandLower.includes(firstVarWord.toLowerCase())) {
      varPart = varPart.slice(firstVarWord.length).trim();
    }
  }

  // Append grade for graded cards — omit 'Raw' as it hurts eBay keyword matching
  const condPart = condition && condition !== 'Raw' ? ` ${condition}` : '';

  return `${year} ${brand} ${player}${varPart ? ' ' + varPart : ''}${condPart}`.replace(/\s{2,}/g, ' ').trim();
}

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
