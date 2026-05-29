import { NextRequest, NextResponse } from 'next/server';
import { getCachedEbay, setCachedEbay, recordPriceHistory } from '@/lib/cache';
import { getEbayAppToken } from '@/lib/ebay-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, validateQuery } from '@/lib/security';

const BROWSE_API = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, 'ebay-pricing', 20);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('q');
  const qResult = validateQuery(raw);
  if (!qResult.ok) {
    return NextResponse.json({ error: qResult.error }, { status: 400 });
  }
  const query = qResult.value;

  const cacheKey = `sold:${query}`;
  const cached = getCachedEbay(cacheKey);
  if (cached) {
    console.log(`[ebay-market] cache hit: "${query}"`);
    return NextResponse.json({ listings: cached, fromCache: true });
  }

  console.log(`[ebay-market] fetching recent market prices for: "${query}"`);

  let token: string;
  try {
    token = await getEbayAppToken();
  } catch (err) {
    console.error('[ebay-market] auth failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'eBay authentication failed.', listings: [], fromCache: false }, { status: 200 });
  }

  try {
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
        'Content-Type':            'application/json',
      },
      next: { revalidate: 0 },
    });

    console.log('[ebay-market] status:', res.status);
    const rawBody = await res.text();

    if (!res.ok) {
      console.error(`[ebay-market] HTTP ${res.status}:`, rawBody.slice(0, 200));
      return NextResponse.json(
        { error: 'eBay pricing unavailable. Please try again.', listings: [], fromCache: false },
        { status: 200 }
      );
    }

    const data = JSON.parse(rawBody) as Record<string, unknown>;
    const rawItems = (data.itemSummaries as Record<string, unknown>[] | undefined) ?? [];
    console.log(`[ebay-market] got ${rawItems.length} items`);

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
          listedAt:  item.itemCreationDate as string | undefined,
        };
      })
      .filter((l) => l.price > 0)
      .sort((a, b) => a.price - b.price);

    setCachedEbay(cacheKey, listings);
    console.log(`[ebay-market] cached ${listings.length} listings`);

    if (listings.length > 0) {
      const avg = listings.reduce((sum, l) => sum + l.price, 0) / listings.length;
      recordPriceHistory(`history:${query}`, Math.round(avg * 100) / 100);
    }

    return NextResponse.json({ listings, fromCache: false });

  } catch (err) {
    console.error('[ebay-market] error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: 'eBay pricing unavailable. Please try again.', listings: [], fromCache: false },
      { status: 200 }
    );
  }
}
