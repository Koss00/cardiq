import { NextRequest, NextResponse } from 'next/server';
import { getCachedEbay, setCachedEbay } from '@/lib/cache';
import { getEbayAppToken } from '@/lib/ebay-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, validateQuery } from '@/lib/security';
import { dbGetEbayCache, dbSetEbayCache, initSchema } from '@/lib/db';

const EBAY_DB_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const BROWSE_API = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'ebay-active', 20);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('q');
  const qResult = validateQuery(raw);
  if (!qResult.ok) {
    return NextResponse.json({ error: qResult.error }, { status: 400 });
  }
  const query = qResult.value;

  const cacheKey = `active:${query}`;

  // 1. In-memory cache (fast, dies on cold start)
  const cached = getCachedEbay(cacheKey);
  if (cached) {
    return NextResponse.json({ listings: cached, fromCache: true });
  }

  // 2. DB cache (persistent across cold starts — checked before hitting eBay API)
  try {
    await initSchema().catch(() => {});
    const dbCached = await dbGetEbayCache(cacheKey, EBAY_DB_TTL_MS);
    if (dbCached) {
      setCachedEbay(cacheKey, dbCached.listings);
      return NextResponse.json({ listings: dbCached.listings, fromCache: true });
    }
  } catch {
    // DB unavailable — fall through to eBay API
  }

  console.log(`[ebay-active] fetching active listings for: "${query}"`);

  let token: string;
  try {
    token = await getEbayAppToken();
  } catch (err) {
    console.error('[ebay-active] auth failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'eBay authentication failed.', listings: [], fromCache: false }, { status: 200 });
  }

  try {
    const params = new URLSearchParams({
      q:      query,
      filter: 'buyingOptions:{FIXED_PRICE}',
      sort:   'price',
      limit:  '10',
    });

    const res = await fetch(`${BROWSE_API}?${params.toString()}`, {
      headers: {
        'Authorization':           `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type':            'application/json',
      },
      next: { revalidate: 0 },
    });

    console.log('[ebay-active] status:', res.status);
    const rawBody = await res.text();

    if (!res.ok) {
      console.error(`[ebay-active] HTTP ${res.status}:`, rawBody.slice(0, 200));
      return NextResponse.json(
        { error: 'eBay listings unavailable. Please try again.', listings: [], fromCache: false },
        { status: 200 }
      );
    }

    const data = JSON.parse(rawBody) as Record<string, unknown>;
    const rawItems = (data.itemSummaries as Record<string, unknown>[] | undefined) ?? [];
    console.log(`[ebay-active] got ${rawItems.length} items`);

    const listings = rawItems
      .map((item) => {
        const priceVal = (item.price as Record<string, string> | undefined)?.value;
        const price    = parseFloat(priceVal ?? '0');
        const imageUrl = (item.image as Record<string, string> | undefined)?.imageUrl;
        return {
          title:     item.title as string,
          price,
          url:       item.itemWebUrl as string,
          condition: item.condition as string | undefined,
          imageUrl,
        };
      })
      .filter((l) => l.price > 0);

    setCachedEbay(cacheKey, listings);
    dbSetEbayCache(cacheKey, listings, 'browse').catch(() => {});
    return NextResponse.json({ listings, fromCache: false });

  } catch (err) {
    console.error('[ebay-active] error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: 'eBay listings unavailable. Please try again.', listings: [], fromCache: false },
      { status: 200 }
    );
  }
}
