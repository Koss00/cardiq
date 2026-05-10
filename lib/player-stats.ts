import type { PlayerStats, PlayerStat } from '@/types';
import { getCachedStats, setCachedStats } from './cache';

// Module-level roster cache — avoids re-fetching ~1000 MLB players per call
let mlbRosterCache: { people: MlbPerson[]; fetchedAt: number } | null = null;
interface MlbPerson { id: number; fullName: string }

// ─── Public entry point ───────────────────────────────────────────────────────

export async function fetchPlayerStats(playerName: string, sport: string): Promise<PlayerStats | null> {
  const cacheKey = `stats:${sport}:${playerName.toLowerCase()}`;
  const cached = getCachedStats(cacheKey);
  if (cached) {
    console.log(`[player-stats] cache hit: ${playerName} (${sport})`);
    return cached as PlayerStats;
  }

  let stats: PlayerStats | null = null;
  try {
    if      (sport === 'Baseball')   stats = await fetchMlbStats(playerName);
    else if (sport === 'Basketball') stats = await fetchNbaStats(playerName);
    else if (sport === 'Football')   stats = await fetchNflStats(playerName);
    else if (sport === 'Golf')       stats = await fetchGolfStats(playerName);
  } catch (err) {
    console.error(`[player-stats] ${sport} failed for "${playerName}":`, err);
  }

  if (stats) setCachedStats(cacheKey, stats);
  return stats;
}

// ─── Name helpers ─────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function nameMatch(rosterName: string, query: string): boolean {
  const r = norm(rosterName);
  const q = norm(query);
  if (r === q) return true;
  const qParts = q.split(' ').filter(Boolean);
  if (qParts.length >= 2) {
    const first = qParts[0];
    const last  = qParts[qParts.length - 1];
    return r.includes(first) && r.includes(last);
  }
  return r.includes(q);
}

// ─── MLB ─────────────────────────────────────────────────────────────────────

async function getMlbRoster(): Promise<MlbPerson[]> {
  if (mlbRosterCache && Date.now() - mlbRosterCache.fetchedAt < 3_600_000) {
    return mlbRosterCache.people;
  }
  const res = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players?season=2026', {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    console.error('[player-stats] MLB roster HTTP', res.status);
    return [];
  }
  const data = await res.json() as { people?: MlbPerson[] };
  const people = data.people ?? [];
  mlbRosterCache = { people, fetchedAt: Date.now() };
  console.log(`[player-stats] MLB roster: ${people.length} active players`);
  return people;
}

async function findMlbPerson(playerName: string): Promise<{ person: MlbPerson; isActive: boolean } | null> {
  // 1. Check active 2026 roster (accented names normalized via norm())
  const roster = await getMlbRoster();
  const active = roster.find((p) => nameMatch(p.fullName, playerName));
  if (active) return { person: active, isActive: true };

  // 2. People search — covers retired, DL, and minor-league call-ups
  console.log(`[player-stats] MLB: "${playerName}" not in 2026 roster, trying people search`);
  const fullRes = await fetch(
    `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(playerName)}&sportId=1`,
    { next: { revalidate: 0 } }
  );
  if (fullRes.ok) {
    const fullData = await fullRes.json() as { people?: MlbPerson[] };
    const match = fullData.people?.find((p) => nameMatch(p.fullName, playerName));
    if (match) return { person: match, isActive: false };
  }

  // 3. Last-name fallback — catches accented variants (e.g. "Julio Rodríguez" vs "Rodriguez")
  const parts = playerName.trim().split(' ');
  const lastName  = parts[parts.length - 1];
  const firstName = parts[0];
  console.log(`[player-stats] MLB: trying last-name search "${lastName}"`);
  const lastRes = await fetch(
    `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(lastName)}&sportId=1`,
    { next: { revalidate: 0 } }
  );
  if (!lastRes.ok) return null;
  const lastData = await lastRes.json() as { people?: MlbPerson[] };
  const byLast = lastData.people?.find((p) => {
    const n = norm(p.fullName);
    return n.includes(norm(firstName)) && n.includes(norm(lastName));
  });
  const found = byLast ?? lastData.people?.[0] ?? null;
  return found ? { person: found, isActive: false } : null;
}

async function fetchMlbStats(playerName: string): Promise<PlayerStats | null> {
  const result = await findMlbPerson(playerName);
  if (!result) {
    console.log(`[player-stats] MLB: no match for "${playerName}"`);
    return null;
  }
  const { person, isActive } = result;
  console.log(`[player-stats] MLB: matched "${person.fullName}" id=${person.id} active=${isActive}`);

  // Active players: try current season first, then prior seasons, then career.
  // Inactive/retired players: skip 2026 (they won't have it), go career last.
  const seasonAttempts = isActive
    ? [
        { statType: 'season', season: 2026 as number | null, label: '2026 SEASON' },
        { statType: 'season', season: 2025 as number | null, label: '2025 SEASON' },
        { statType: 'season', season: 2024 as number | null, label: '2024 SEASON' },
        { statType: 'career', season: null,                  label: 'Career Highlights' },
      ]
    : [
        { statType: 'season', season: 2025 as number | null, label: '2025 SEASON' },
        { statType: 'season', season: 2024 as number | null, label: '2024 SEASON' },
        { statType: 'career', season: null,                  label: 'Career Highlights' },
      ];

  for (const { statType, season, label } of seasonAttempts) {
    // FIX: season param must be comma-separated INSIDE the hydrate parens, not a bare & in the URL.
    // Wrong: ?hydrate=stats(...,type=[season&season=2026])  — & acts as URL separator
    // Right: ?hydrate=stats(...,type=season,season=2026)
    const seasonParam = season != null ? `,season=${season}` : '';
    const url =
      `https://statsapi.mlb.com/api/v1/people/${person.id}` +
      `?hydrate=stats(group=[hitting,pitching],type=${statType}${seasonParam}),currentTeam`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) continue;

    const data   = await res.json() as { people?: Record<string, unknown>[] };
    const pd     = data.people?.[0] as Record<string, unknown> | undefined;
    if (!pd) continue;

    const team     = (pd.currentTeam as Record<string, string> | undefined)?.name;
    const allStats = (pd.stats as Record<string, unknown>[] | undefined) ?? [];
    const entries: PlayerStat[] = [];

    const hitStat = getSplitStat(allStats, 'hitting');
    if (hitStat) {
      push(entries, 'AVG', hitStat.avg);
      push(entries, 'HR',  hitStat.homeRuns);
      push(entries, 'RBI', hitStat.rbi);
      push(entries, 'OPS', hitStat.ops);
      push(entries, 'SB',  hitStat.stolenBases);
    }

    const pitchStat = getSplitStat(allStats, 'pitching');
    if (pitchStat) {
      push(entries, 'ERA',  pitchStat.era);
      if (pitchStat.wins != null && pitchStat.losses != null)
        entries.push({ label: 'W-L', value: `${pitchStat.wins}-${pitchStat.losses}` });
      push(entries, 'K',    pitchStat.strikeOuts);
      push(entries, 'WHIP', pitchStat.whip);
    }

    if (entries.length > 0) {
      const isRetired = !isActive && statType === 'career';
      console.log(`[player-stats] MLB: ${entries.length} stats for ${person.fullName} (${label}${isRetired ? ', retired' : ''})`);
      return {
        playerName: person.fullName,
        sport: 'Baseball',
        team,
        season: label,
        stats: entries,
        source: 'MLB Stats API',
        isRetired,
      };
    }
  }

  console.log(`[player-stats] MLB: no stats found for ${person.fullName}`);
  return null;
}

function getSplitStat(allStats: Record<string, unknown>[], groupName: string) {
  const group = allStats.find(
    (s) => (s.group as Record<string, string>)?.displayName?.toLowerCase() === groupName
  );
  return (group?.splits as Record<string, unknown>[])?.[0]?.stat as Record<string, unknown> | undefined;
}

// ─── NBA via BallDontLie (v1 API) ─────────────────────────────────────────────

async function fetchNbaStats(playerName: string): Promise<PlayerStats | null> {
  const apiKey = process.env.BALLDONTLIE_API_KEY?.trim();
  if (apiKey && apiKey !== 'your-balldontlie-key-here') {
    const result = await fetchNbaViaBallDontLie(playerName, apiKey);
    if (result) return result;
  }
  return fetchNbaViaEspn(playerName);
}

async function fetchNbaViaBallDontLie(playerName: string, apiKey: string): Promise<PlayerStats | null> {
  const searchRes = await fetch(
    `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(playerName)}&per_page=5`,
    { headers: { Authorization: apiKey }, next: { revalidate: 0 } }
  );
  console.log(`[player-stats] BallDontLie search status: ${searchRes.status}`);
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json() as {
    data?: { id: number; first_name: string; last_name: string; team?: { full_name: string } }[];
  };
  const player = searchData.data?.find((p) =>
    nameMatch(`${p.first_name} ${p.last_name}`, playerName)
  ) ?? searchData.data?.[0];

  if (!player) {
    console.log(`[player-stats] BallDontLie: no match for "${playerName}"`);
    return null;
  }
  console.log(`[player-stats] BallDontLie: found ${player.first_name} ${player.last_name} id=${player.id}`);

  // Try newest season first: 2025 = 2025-26, 2024 = 2024-25
  for (const season of [2025, 2024, 2023]) {
    // Fetch season averages and (for current season) last 5 game stats in parallel
    const fetchPromises: [Promise<Response>, Promise<Response | null>] = [
      fetch(
        `https://api.balldontlie.io/v1/season_averages?player_id=${player.id}&season=${season}`,
        { headers: { Authorization: apiKey }, next: { revalidate: 0 } }
      ),
      season === 2025
        ? fetch(
            `https://api.balldontlie.io/v1/stats?player_ids[]=${player.id}&seasons[]=${season}&per_page=5`,
            { headers: { Authorization: apiKey }, next: { revalidate: 0 } }
          )
        : Promise.resolve(null),
    ];

    const [avgRes, recentRes] = await Promise.all(fetchPromises);
    if (!avgRes.ok) continue;

    const avgData = await avgRes.json() as {
      data?: {
        pts: number; reb: number; ast: number; fg_pct: number;
        fg3_pct?: number; stl: number; blk: number; games_played: number;
      }[];
    };
    const avg = avgData.data?.[0];
    if (!avg) continue;

    const entries: PlayerStat[] = [
      { label: 'PPG', value: Number(avg.pts).toFixed(1) },
      { label: 'RPG', value: Number(avg.reb).toFixed(1) },
      { label: 'APG', value: Number(avg.ast).toFixed(1) },
      { label: 'FG%', value: `${(Number(avg.fg_pct) * 100).toFixed(1)}%` },
    ];
    if (avg.fg3_pct != null) entries.push({ label: '3P%', value: `${(Number(avg.fg3_pct) * 100).toFixed(1)}%` });
    if (avg.stl  != null)    entries.push({ label: 'SPG', value: Number(avg.stl).toFixed(1) });
    if (avg.blk  != null)    entries.push({ label: 'BPG', value: Number(avg.blk).toFixed(1) });

    // Last-5-games PPG trend vs. season average
    if (recentRes?.ok) {
      try {
        const recentData = await recentRes.json() as { data?: { pts: number }[] };
        const games = recentData.data ?? [];
        if (games.length >= 3) {
          const slice = games.slice(0, 5);
          const l5avg = slice.reduce((s, g) => s + Number(g.pts), 0) / slice.length;
          const seasonPPG = Number(avg.pts);
          const arrow = l5avg > seasonPPG + 2 ? '▲' : l5avg < seasonPPG - 2 ? '▼' : '→';
          entries.push({ label: 'L5', value: `${l5avg.toFixed(1)} ${arrow}` });
        }
      } catch {
        // last-5 is best-effort; silently skip on parse error
      }
    }

    const seasonLabel = `${season}-${String(season + 1).slice(2)} SEASON`;
    console.log(`[player-stats] BallDontLie: ${entries.length} stats (${seasonLabel})`);
    return {
      playerName: `${player.first_name} ${player.last_name}`,
      sport: 'Basketball',
      team: player.team?.full_name,
      season: seasonLabel,
      stats: entries,
      source: 'BallDontLie',
    };
  }

  return null;
}

async function fetchNbaViaEspn(playerName: string): Promise<PlayerStats | null> {
  const searchRes = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes` +
    `?search=${encodeURIComponent(playerName)}&limit=10`,
    { next: { revalidate: 0 } }
  );
  console.log(`[player-stats] ESPN NBA search status: ${searchRes.status}`);
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json() as { items?: Record<string, unknown>[] };
  const items = searchData.items ?? [];
  if (!items.length) return null;

  const athlete = (
    items.find((a) => nameMatch(String(a.fullName ?? ''), playerName)) ?? items[0]
  ) as Record<string, unknown>;

  const athleteId = String(athlete.id ?? '');
  const fullName  = String(athlete.fullName ?? playerName);
  const team      = extractEspnTeam(athlete.team);

  console.log(`[player-stats] ESPN NBA: matched "${fullName}" id=${athleteId}`);

  for (const season of [2026, 2025, 2024]) {
    const url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${season}/athletes/${athleteId}/statistics/0`;
    const statsRes = await fetch(url, { next: { revalidate: 0 } });
    if (!statsRes.ok) continue;

    const statsData = await statsRes.json() as Record<string, unknown>;
    const entries = parseEspnStats(statsData, ['PPG', 'RPG', 'APG', 'FG%', '3P%', 'PTS', 'REB', 'AST', 'STL', 'BLK']);

    if (entries.length > 0) {
      const seasonLabel = `${season - 1}-${String(season).slice(2)} SEASON`;
      console.log(`[player-stats] ESPN NBA: ${entries.length} stats (${seasonLabel})`);
      return { playerName: fullName, sport: 'Basketball', team, season: seasonLabel, stats: entries, source: 'ESPN' };
    }
  }

  return null;
}

// ─── NFL via ESPN ─────────────────────────────────────────────────────────────

async function fetchNflStats(playerName: string): Promise<PlayerStats | null> {
  const searchRes = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes` +
    `?search=${encodeURIComponent(playerName)}&limit=10`,
    { next: { revalidate: 0 } }
  );
  console.log(`[player-stats] NFL search status: ${searchRes.status}`);
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json() as { items?: Record<string, unknown>[] };
  const items = searchData.items ?? [];
  if (!items.length) {
    console.log(`[player-stats] NFL: no results for "${playerName}"`);
    return null;
  }

  const athlete = (
    items.find((a) => nameMatch(String(a.fullName ?? ''), playerName)) ?? items[0]
  ) as Record<string, unknown>;

  const athleteId = String(athlete.id ?? '');
  const fullName  = String(athlete.fullName ?? playerName);
  const team      = extractEspnTeam(athlete.team);
  const position  = (athlete.position as Record<string, string> | undefined)?.abbreviation ?? '';

  console.log(`[player-stats] NFL: matched "${fullName}" id=${athleteId} pos=${position}`);

  const wantedByPos: Record<string, string[]> = {
    QB: ['YDS', 'TD', 'INT', 'CMP%', 'QBR', 'RTG', 'PYDS'],
    RB: ['YDS', 'TD', 'AVG', 'CAR', 'RYDS'],
    WR: ['REC', 'YDS', 'TD', 'AVG', 'REYDS'],
    TE: ['REC', 'YDS', 'TD', 'AVG'],
  };
  const wanted = wantedByPos[position] ?? ['YDS', 'TD', 'REC', 'INT', 'AVG'];

  // Try 2025 (most recent full season) then fall back
  for (const season of [2025, 2024, 2023]) {
    const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/athletes/${athleteId}/statistics/0`;
    const statsRes = await fetch(url, { next: { revalidate: 0 } });
    console.log(`[player-stats] NFL stats ${season} status: ${statsRes.status}`);
    if (!statsRes.ok) continue;

    const statsData = await statsRes.json() as Record<string, unknown>;
    const entries = parseEspnStats(statsData, wanted);

    if (entries.length > 0) {
      console.log(`[player-stats] NFL: ${entries.length} stats for ${fullName} (${season})`);
      const injuryStatus = (athlete.injuries as Record<string, string>[] | undefined)?.[0]?.status;
      return {
        playerName: fullName,
        sport: 'Football',
        team,
        season: `${season} SEASON`,
        stats: entries,
        source: 'ESPN',
        injuryStatus,
      };
    }
  }

  // Position + team minimum fallback
  const fallback: PlayerStat[] = [];
  if (position) fallback.push({ label: 'POS',  value: position });
  if (team)     fallback.push({ label: 'TEAM', value: team });
  if (fallback.length) {
    return { playerName: fullName, sport: 'Football', team, season: '2025 SEASON', stats: fallback, source: 'ESPN' };
  }

  return null;
}

// ─── Golf via ESPN ────────────────────────────────────────────────────────────

async function fetchGolfStats(playerName: string): Promise<PlayerStats | null> {
  const searchRes = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/golf/pga/athletes` +
    `?search=${encodeURIComponent(playerName)}&limit=10`,
    { next: { revalidate: 0 } }
  );
  console.log(`[player-stats] Golf search status: ${searchRes.status}`);
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json() as { items?: Record<string, unknown>[] };
  const items = searchData.items ?? [];
  if (!items.length) {
    console.log(`[player-stats] Golf: no results for "${playerName}"`);
    return null;
  }

  const athlete = (
    items.find((a) => nameMatch(String(a.fullName ?? ''), playerName)) ?? items[0]
  ) as Record<string, unknown>;

  const athleteId = String(athlete.id ?? '');
  const fullName  = String(athlete.fullName ?? playerName);
  console.log(`[player-stats] Golf: matched "${fullName}" id=${athleteId}`);

  // World ranking from athlete object (ESPN often includes it directly)
  const entries: PlayerStat[] = [];
  const rank = (athlete.rank as number | undefined) ?? (athlete.worldRanking as number | undefined);
  if (rank) entries.push({ label: 'WR', value: `#${rank}` });

  for (const season of [2025, 2024]) {
    const statsRes = await fetch(
      `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/seasons/${season}/athletes/${athleteId}/statistics/0`,
      { next: { revalidate: 0 } }
    );
    if (!statsRes.ok) continue;

    const statsData = await statsRes.json() as Record<string, unknown>;
    const seasonEntries = parseEspnStats(
      statsData,
      ['WINS', 'TOP10', 'TOP25', 'CUTS', 'AVG', 'FEDEXPTS', 'EARNINGS', 'EVENTS']
    );

    if (seasonEntries.length > 0 || entries.length > 0) {
      const combined = entries.filter((e) => !seasonEntries.find((s) => s.label === e.label));
      const all = [...combined, ...seasonEntries];
      console.log(`[player-stats] Golf: ${all.length} stats for ${fullName} (${season})`);
      return {
        playerName: fullName,
        sport: 'Golf',
        season: `${season} PGA TOUR`,
        stats: all,
        source: 'ESPN',
      };
    }
  }

  // Return ranking-only if no season stats
  if (entries.length > 0) {
    return { playerName: fullName, sport: 'Golf', season: '2025 PGA TOUR', stats: entries, source: 'ESPN' };
  }

  return null;
}

// ─── ESPN stats parser ────────────────────────────────────────────────────────

function parseEspnStats(data: Record<string, unknown>, wanted: string[]): PlayerStat[] {
  const entries: PlayerStat[] = [];
  const wantedSet = new Set(wanted.map((w) => w.toUpperCase()));

  const splits     = data.splits as Record<string, unknown> | undefined;
  const categories = (splits?.categories ?? data.categories) as Record<string, unknown>[] | undefined;

  if (!categories?.length) {
    console.log('[player-stats] ESPN: no categories, keys:', Object.keys(data).join(', '));
    return entries;
  }

  for (const cat of categories) {
    const stats = cat.stats as Record<string, unknown>[] | undefined;
    if (!stats) continue;
    for (const s of stats) {
      const abbr = String(s.abbreviation ?? s.shortDisplayName ?? '').toUpperCase();
      const val  = String(s.displayValue ?? s.value ?? '');
      if (abbr && val && val !== '0' && val !== '0.0' && wantedSet.has(abbr) && entries.length < 7) {
        entries.push({ label: abbr, value: val });
      }
    }
  }

  return entries;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractEspnTeam(teamField: unknown): string | undefined {
  if (!teamField || typeof teamField !== 'object') return undefined;
  const t = teamField as Record<string, unknown>;
  if (typeof t.displayName === 'string') return t.displayName;
  if (typeof t.name === 'string') return t.name;
  return undefined;
}

function push(entries: PlayerStat[], label: string, value: unknown) {
  if (value != null && value !== '') entries.push({ label, value: String(value) });
}
