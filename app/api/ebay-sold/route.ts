import { NextRequest, NextResponse } from 'next/server';
import { getCachedEbay, setCachedEbay, recordPriceHistory } from '@/lib/cache';
import { getEbayAppToken } from '@/lib/ebay-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, validateQuery } from '@/lib/security';
import { dbGetEbayCache, dbSetEbayCache, initSchema } from '@/lib/db';

const EBAY_DB_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const FINDING_API = 'https://svcs.ebay.com/services/search/FindingService/v1';
const BROWSE_API  = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'ebay-sold', 20);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('q');
  const qResult = validateQuery(raw);
  if (!qResult.ok) return NextResponse.json({ error: qResult.error }, { status: 400 });
  const query = qResult.value;

  const cacheKey = `sold-completed:${query}`;

  // 1. In-memory cache (fast, dies on cold start)
  const cached = getCachedEbay(cacheKey);
  if (cached) return NextResponse.json({ listings: cached, fromCache: true, source: 'sold' });

  // 2. DB cache (persistent across cold starts — checked before hitting eBay API)
  try {
    await initSchema().catch(() => {});
    const dbCached = await dbGetEbayCache(cacheKey, EBAY_DB_TTL_MS);
    if (dbCached) {
      setCachedEbay(cacheKey, dbCached.listings); // warm in-memory
      return NextResponse.json({ listings: dbCached.listings, fromCache: true, source: dbCached.source });
    }
  } catch {
    // DB unavailable — fall through to eBay API
  }

  const appId = process.env.EBAY_APP_ID;
  if (!appId) return NextResponse.json({ error: 'eBay not configured.', listings: [], fromCache: false });

  // ── Try Finding API (actual sold comps) ──────────────────────────────────────
  try {
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
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      const searchResult = (data.findCompletedItemsResponse as Record<string, unknown>[])?.[0];
      const ack = (searchResult?.ack as string[])?.[0];

      if (ack === 'Success') {
        const rawItems = (
          (searchResult?.searchResult as Record<string, unknown>[])?.[0]?.item as Record<string, unknown>[]
        ) ?? [];

        const listings = rawItems.map((item) => {
          const sellingStatus = (item.sellingStatus as Record<string, unknown>[])?.[0];
          const priceVal = (sellingStatus?.convertedCurrentPrice as Record<string, string>[])?.[0]?.__value__;
          const price = parseFloat(priceVal ?? '0');
          const galleryURL = (item.galleryURL as string[])?.[0];
          const viewItemURL = (item.viewItemURL as string[])?.[0];
          const title = (item.title as string[])?.[0] ?? '';
          const endTime = (item.listingInfo as Record<string, unknown>[])?.[0]?.endTime as string[] | undefined;
          const soldDate = endTime?.[0]
            ? new Date(endTime[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : undefined;
          return { title, price, url: viewItemURL ?? '', imageUrl: galleryURL, soldDate };
        }).filter((l) => l.price > 0);

        if (listings.length > 0) {
          setCachedEbay(cacheKey, listings);
          dbSetEbayCache(cacheKey, listings, 'sold').catch(() => {});
          const avg = listings.reduce((s, l) => s + l.price, 0) / listings.length;
          recordPriceHistory(`history:${query}`, Math.round(avg * 100) / 100);
          return NextResponse.json({ listings, fromCache: false, source: 'sold' });
        }
      }
    }
    console.log('[ebay-sold] Finding API unavailable or empty — falling back to Browse API');
  } catch (err) {
    console.warn('[ebay-sold] Finding API error:', err instanceof Error ? err.message : String(err));
  }

  // ── Fallback: Browse API recent listings ─────────────────────────────────────
  try {
    const token = await getEbayAppToken();
    const params = new URLSearchParams({
      q:      query,
      filter: 'buyingOptions:{FIXED_PRICE|AUCTION}',
      sort:   'endingSoonest',
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
      const price = parseFloat(priceVal ?? '0');
      const imageUrl = (item.image as Record<string, string> | undefined)?.imageUrl;
      return { title: item.title as string, price, url: item.itemWebUrl as string, imageUrl };
    }).filter((l) => l.price > 0).sort((a, b) => a.price - b.price);

    setCachedEbay(cacheKey, listings);
    dbSetEbayCache(cacheKey, listings, 'browse').catch(() => {});
    if (listings.length > 0) {
      const avg = listings.reduce((s, l) => s + l.price, 0) / listings.length;
      recordPriceHistory(`history:${query}`, Math.round(avg * 100) / 100);
    }

    return NextResponse.json({ listings, fromCache: false, source: 'browse' });
  } catch (err) {
    console.error('[ebay-sold] Browse fallback error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'eBay pricing unavailable.', listings: [], fromCache: false });
  }
}
