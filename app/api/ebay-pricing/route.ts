import { NextRequest, NextResponse } from 'next/server';
import { getCachedEbay, setCachedEbay, recordPriceHistory } from '@/lib/cache';
import { getEbayAppToken } from '@/lib/ebay-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, validateQuery } from '@/lib/security';
import { dbGetEbayCache, dbSetEbayCache, initSchema } from '@/lib/db';
import { fetchFindingSold } from '@/lib/ebay-utils';

const EBAY_DB_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const BROWSE_API     = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, 'ebay-pricing', 20);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('q');
  const qResult = validateQuery(raw);
  if (!qResult.ok) return NextResponse.json({ error: qResult.error }, { status: 400 });
  const query  = qResult.value;
  const player = searchParams.get('player') ?? undefined;

  const cacheKey = `ebay:${query}`;

  // 1. In-memory cache — fast, dies on cold start
  const cached = getCachedEbay(cacheKey);
  if (cached) {
    return NextResponse.json({ listings: cached.listings, fromCache: true, source: cached.source });
  }

  // 2. DB cache — persistent across cold starts
  try {
    await initSchema().catch(() => {});
    const dbCached = await dbGetEbayCache(cacheKey, EBAY_DB_TTL_MS);
    if (dbCached) {
      setCachedEbay(cacheKey, dbCached.listings, dbCached.source);
      return NextResponse.json({ listings: dbCached.listings, fromCache: true, source: dbCached.source });
    }
  } catch {
    // DB unavailable — fall through to eBay API
  }

  const appId = process.env.EBAY_APP_ID;
  if (!appId) return NextResponse.json({ error: 'eBay not configured.', listings: [], fromCache: false });

  // ── Primary: Finding API (real sold prices) ──────────────────────────────
  const soldListings = await fetchFindingSold(query, appId, player).catch(() => null);
  if (soldListings && soldListings.length > 0) {
    setCachedEbay(cacheKey, soldListings, 'sold');
    dbSetEbayCache(cacheKey, soldListings, 'sold').catch(() => {});
    const avg = soldListings.reduce((s, l) => s + l.price, 0) / soldListings.length;
    recordPriceHistory(`history:${query}`, Math.round(avg * 100) / 100);
    return NextResponse.json({ listings: soldListings, fromCache: false, source: 'sold' });
  }

  // ── Fallback: Browse API (active listings) ───────────────────────────────
  console.log(`[ebay-pricing] Finding API empty for "${query}" — falling back to Browse API`);
  try {
    const token = await getEbayAppToken();
    const params = new URLSearchParams({
      q:      query,
      filter: 'buyingOptions:{FIXED_PRICE|AUCTION}',
      sort:   'newlyListed',
      limit:  '10',
    });

    const res = await fetch(`${BROWSE_API}?${params.toString()}`, {
      headers: {
        'Authorization':           `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`Browse API ${res.status}`);

    const data = await res.json() as Record<string, unknown>;
    const rawItems = (data.itemSummaries as Record<string, unknown>[]) ?? [];

    const listings = rawItems.map((item) => {
      const priceVal = (item.price as Record<string, string> | undefined)?.value;
      const price    = parseFloat(priceVal ?? '0');
      const imageUrl = (item.image as Record<string, string> | undefined)?.imageUrl;
      return {
        title:    item.title as string,
        price,
        url:      item.itemWebUrl as string,
        imageUrl,
        listedAt: item.itemCreationDate as string | undefined,
      };
    }).filter((l) => l.price > 0).sort((a, b) => a.price - b.price);

    setCachedEbay(cacheKey, listings, 'active');
    dbSetEbayCache(cacheKey, listings, 'active').catch(() => {});
    if (listings.length > 0) {
      const avg = listings.reduce((s, l) => s + l.price, 0) / listings.length;
      recordPriceHistory(`history:${query}`, Math.round(avg * 100) / 100);
    }

    return NextResponse.json({ listings, fromCache: false, source: 'active' });
  } catch (err) {
    console.error('[ebay-pricing] Browse fallback error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'eBay pricing unavailable.', listings: [], fromCache: false });
  }
}
