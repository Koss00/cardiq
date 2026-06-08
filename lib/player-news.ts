import { getCachedStats, setCachedStats } from './cache';

const SPORT_PATHS: Record<string, string> = {
  Baseball:   'baseball/mlb',
  Basketball: 'basketball/nba',
  Football:   'football/nfl',
  Hockey:     'hockey/nhl',
  Golf:       'golf/pga',
};

// Hard cap — ESPN news fetch must resolve within 3s or we skip it.
const NEWS_FETCH_TIMEOUT_MS = 3_000;

/**
 * Fetch the most recent ESPN headlines that mention this player.
 * Returns up to 3 relevant headlines cached for 2h (using the stats cache).
 */
export async function fetchPlayerNews(playerName: string, sport: string): Promise<string[]> {
  const cacheKey = `news:${sport}:${playerName.toLowerCase()}`;
  const cached = getCachedStats(cacheKey);
  if (cached) return cached as string[];

  const sportPath = SPORT_PATHS[sport];
  if (!sportPath) return [];

  let timedOut = false;

  try {
    const fetchWork = async (): Promise<string[]> => {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/news?limit=25`,
        { next: { revalidate: 0 } }
      );
      if (!res.ok) return [];

      const data = await res.json() as {
        articles?: Array<{ headline: string; description?: string; published?: string }>;
      };

      const nameParts = playerName.toLowerCase().split(' ').filter((w) => w.length > 3);
      return (data.articles ?? [])
        .filter((a) => {
          const text = `${a.headline} ${a.description ?? ''}`.toLowerCase();
          return nameParts.some((part) => text.includes(part));
        })
        .slice(0, 3)
        .map((a) => {
          const date = a.published
            ? ` (${new Date(a.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
            : '';
          return a.description
            ? `${a.headline}${date} — ${a.description.slice(0, 100)}`
            : `${a.headline}${date}`;
        });
    };

    const relevant = await Promise.race([
      fetchWork(),
      new Promise<string[]>((resolve) => setTimeout(() => {
        console.warn(`[player-news] timeout (${NEWS_FETCH_TIMEOUT_MS}ms) for "${playerName}"`);
        timedOut = true;
        resolve([]);
      }, NEWS_FETCH_TIMEOUT_MS)),
    ]);

    // Only cache real results — don't cache timeout fallbacks (ESPN might recover)
    if (!timedOut) setCachedStats(cacheKey, relevant);
    return relevant;
  } catch (err) {
    console.warn(`[player-news] ESPN fetch failed for "${playerName}":`, err);
    return [];
  }
}
