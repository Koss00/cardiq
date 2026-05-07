import { NextRequest, NextResponse } from 'next/server';
import { getCachedEbay, setCachedEbay } from '@/lib/cache';
import { getEbayAppToken } from '@/lib/ebay-auth';

const BROWSE_API = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'q parameter required' }, { status: 400 });
  }

  const cacheKey = `sold:${query}`;
  const cached = getCachedEbay(cacheKey);
  if (cached) {
    console.log(`[ebay-sold] cache hit: "${query}"`);
    return NextResponse.json({ listings: cached, fromCache: true });
  }

  console.log(`[ebay-sold] fetching recent comps for: "${query}"`);

  let token: string;
  try {
    token = await getEbayAppToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ebay-sold] auth failed:', msg);
    return NextResponse.json({ error: msg, listings: [], fromCache: false }, { status: 200 });
  }

  try {
    const params = new URLSearchParams({
      q:      query,
      filter: 'buyingOptions:{FIXED_PRICE|AUCTION}',
      sort:   'newlyListed',
      limit:  '10',
    });

    const fullUrl = `${BROWSE_API}?${params.toString()}`;
    console.log('[ebay-sold] request URL:', fullUrl);

    const res = await fetch(fullUrl, {
      headers: {
        'Authorization':           `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type':            'application/json',
      },
      next: { revalidate: 0 },
    });

    console.log('[ebay-sold] status:', res.status, res.statusText);
    const rawBody = await res.text();
    console.log('[ebay-sold] raw response:', rawBody.slice(0, 600));

    if (!res.ok) {
      return NextResponse.json(
        { error: `eBay API HTTP ${res.status}: ${rawBody.slice(0, 200)}`, listings: [], fromCache: false },
        { status: 200 }
      );
    }

    const data = JSON.parse(rawBody) as Record<string, unknown>;
    const rawItems = (data.itemSummaries as Record<string, unknown>[] | undefined) ?? [];
    console.log(`[ebay-sold] got ${rawItems.length} items`);

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
    console.log(`[ebay-sold] cached ${listings.length} listings`);
    return NextResponse.json({ listings, fromCache: false });

  } catch (err) {
    console.error('[ebay-sold] error:', err);
    return NextResponse.json(
      { error: 'eBay request failed — check server logs', listings: [], fromCache: false },
      { status: 200 }
    );
  }
}
