import type { PlayerStats, PlayerStat } from '@/types';
import { getCachedStats, setCachedStats } from './cache';

// Players confirmed active — never label as historical regardless of roster lookup.
// Offseason players won't appear in active-roster endpoints but are NOT retired.
export const KNOWN_ACTIVE = new Set([
  'julio rodriguez', 'julio rodriguez jr.',
  'patrick mahomes', 'josh allen', 'jalen hurts', 'lamar jackson',
  'luka doncic', 'victor wembanyama', 'lebron james', 'stephen curry',
  'giannis antetokounmpo', 'kevin durant', 'nikola jokic', 'jayson tatum',
  'shai gilgeous-alexander', 'tyrese haliburton', 'cade cunningham',
]);

// ESPN athlete IDs for NFL players where search may fail in offseason
const NFL_ESPN_IDS: Record<string, string> = {
  'patrick mahomes': '3139477',
  'josh allen':      '3918298',
  'lamar jackson':   '3916387',
  'jalen hurts':     '4040715',
};

// Hardcoded fallback stats — used when live APIs fail for confirmed active players.
// These are used as a last resort only; live data always takes priority.
const HARDCODED_FALLBACK_STATS: Record<string, PlayerStats> = {
  'patrick mahomes': {
    playerName: 'Patrick Mahomes',
    sport: 'Football',
    team: 'Kansas City Chiefs',
    season: '2024 SEASON (cached)',
    stats: [
      { label: 'YDS', value: '3876' },
      { label: 'TD',  value: '26'   },
      { label: 'INT', value: '11'   },
      { label: 'QBR', value: '95.7' },
    ],
    source: 'Cached',
    knownActive: true,
  },
  'victor wembanyama': {
    playerName: 'Victor Wembanyama',
    sport: 'Basketball',
    team: 'San Antonio Spurs',
    season: '2024-25 SEASON (cached)',
    stats: [
      { label: 'PPG', value: '24.3' },
      { label: 'RPG', value: '10.7' },
      { label: 'APG', value: '3.9'  },
      { label: 'BPG', value: '3.6'  },
    ],
    source: 'Cached',
    knownActive: true,
  },
  'luka doncic': {
    playerName: 'Luka Doncic',
    sport: 'Basketball',
    team: 'Los Angeles Lakers',
    season: '2024-25 SEASON (cached)',
    stats: [
      { label: 'PPG', value: '28.1' },
      { label: 'RPG', value: '8.0'  },
      { label: 'APG', value: '8.0'  },
      { label: 'FG%', value: '47.3%'},
    ],
    source: 'Cached',
    knownActive: true,
  },
};

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
    else if (sport === 'Hockey')     stats = await fetchNhlStats(playerName);
    else if (sport === 'Soccer')     stats = await fetchSoccerStats(playerName);
    else if (sport === 'Golf')       stats = await fetchGolfStats(playerName);
  } catch (err) {
    console.error(`[player-stats] ${sport} failed for "${playerName}":`, err);
  }

  // Last-resort fallback: hardcoded stats for confirmed active players
  if (!stats) {
    const fallback = HARDCODED_FALLBACK_STATS[norm(playerName)];
    if (fallback) {
      console.log(`[player-stats] using hardcoded fallback stats for "${playerName}"`);
      stats = fallback;
    }
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
  // gameType=R = regular season active roster only
  const res = await fetch(
    'https://statsapi.mlb.com/api/v1/sports/1/players?season=2026&gameType=R',
    { next: { revalidate: 0 } }
  );
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
  const knownActive = KNOWN_ACTIVE.has(norm(playerName));

  // 1. Active 2026 regular-season roster (catches accented names via norm())
  const roster = await getMlbRoster();
  const active = roster.find((p) => nameMatch(p.fullName, playerName));
  if (active) return { person: active, isActive: true };

  // 2. People search — covers retired/DL/minor-league
  console.log(`[player-stats] MLB: "${playerName}" not in 2026 roster, trying people search`);
  const fullRes = await fetch(
    `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(playerName)}&sportId=1`,
    { next: { revalidate: 0 } }
  );
  if (fullRes.ok) {
    const fullData = await fullRes.json() as { people?: MlbPerson[] };
    const match = fullData.people?.find((p) => nameMatch(p.fullName, playerName));
    if (match) return { person: match, isActive: knownActive };
  }

  // 3. Last-name fallback — catches accent variants ("Rodríguez" vs "Rodriguez")
  const parts   = playerName.trim().split(' ');
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
  return found ? { person: found, isActive: knownActive } : null;
}

async function fetchMlbStats(playerName: string): Promise<PlayerStats | null> {
  const result = await findMlbPerson(playerName);
  if (!result) {
    console.log(`[player-stats] MLB: no match for "${playerName}"`);
    return null;
  }
  const { person, isActive } = result;
  const knownActive = isActive || KNOWN_ACTIVE.has(norm(playerName));
  console.log(`[player-stats] MLB: matched "${person.fullName}" id=${person.id} active=${isActive}`);

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
    // Use single-group hydrate per request — combining group=[hitting,pitching] breaks the
    // season parameter in the MLB Stats API. Try hitting first, fall back to pitching.
    const seasonClause = season != null ? `,season=${season}` : '';
    const entries: PlayerStat[] = [];
    let team: string | undefined;

    for (const group of ['hitting', 'pitching'] as const) {
      // Skip pitching if hitting already returned stats (most players are position players)
      if (group === 'pitching' && entries.length > 0) break;

      const url =
        `https://statsapi.mlb.com/api/v1/people` +
        `?personIds=${person.id}` +
        `&hydrate=stats(group=[${group}],type=[${statType}]${seasonClause}),currentTeam`;

      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) continue;

      const data   = await res.json() as { people?: Record<string, unknown>[] };
      const pd     = data.people?.[0] as Record<string, unknown> | undefined;
      if (!pd) continue;

      if (!team) team = (pd.currentTeam as Record<string, string> | undefined)?.name;
      const allStats = (pd.stats as Record<string, unknown>[] | undefined) ?? [];

      if (group === 'hitting') {
        const hitStat = getSplitStat(allStats, 'hitting');
        if (hitStat) {
          push(entries, 'AVG', hitStat.avg);
          push(entries, 'HR',  hitStat.homeRuns);
          push(entries, 'RBI', hitStat.rbi);
          push(entries, 'OPS', hitStat.ops);
          push(entries, 'SB',  hitStat.stolenBases);
        }
      } else {
        const pitchStat = getSplitStat(allStats, 'pitching');
        if (pitchStat) {
          push(entries, 'ERA',  pitchStat.era);
          if (pitchStat.wins != null && pitchStat.losses != null)
            entries.push({ label: 'W-L', value: `${pitchStat.wins}-${pitchStat.losses}` });
          push(entries, 'K',    pitchStat.strikeOuts);
          push(entries, 'WHIP', pitchStat.whip);
        }
      }
    }

    if (entries.length > 0) {
      const isRetired = !knownActive && statType === 'career';
      console.log(`[player-stats] MLB: ${entries.length} stats for ${person.fullName} (${label}${isRetired ? ', retired' : ''})`);
      return {
        playerName: person.fullName,
        sport: 'Baseball',
        team,
        season: label,
        stats: entries,
        source: 'MLB Stats API',
        isRetired,
        knownActive,
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
  // BallDontLie v1 uses raw API key — NOT "Bearer <token>"
  const authHeader = apiKey.startsWith('Bearer ') ? apiKey : apiKey;

  const searchUrl = `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(playerName)}&per_page=5`;
  console.log(`[player-stats] BallDontLie search URL: ${searchUrl}`);

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: authHeader },
    next: { revalidate: 0 },
  });
  console.log(`[player-stats] BallDontLie search status: ${searchRes.status}`);

  const rawBody = await searchRes.text();
  console.log(`[player-stats] BallDontLie search raw response: ${rawBody.slice(0, 500)}`);

  if (!searchRes.ok) {
    console.error(`[player-stats] BallDontLie search failed: ${searchRes.status} — ${rawBody.slice(0, 200)}`);
    return null;
  }

  let searchData: { data?: { id: number; first_name: string; last_name: string; team?: { full_name: string } }[] };
  try {
    searchData = JSON.parse(rawBody);
  } catch {
    console.error(`[player-stats] BallDontLie search JSON parse error: ${rawBody.slice(0, 200)}`);
    return null;
  }

  console.log(`[player-stats] BallDontLie search returned ${searchData.data?.length ?? 0} players`);

  const player = searchData.data?.find((p) =>
    nameMatch(`${p.first_name} ${p.last_name}`, playerName)
  ) ?? searchData.data?.[0];

  if (!player) {
    console.log(`[player-stats] BallDontLie: no match for "${playerName}" — full results: ${JSON.stringify(searchData.data?.map(p => `${p.first_name} ${p.last_name}`))}`);
    return null;
  }
  console.log(`[player-stats] BallDontLie: found ${player.first_name} ${player.last_name} id=${player.id}`);

  // 2024 = 2024-25 season (most recently completed), 2025 = 2025-26 (current/just finished)
  for (const season of [2024, 2025, 2023]) {
    // BallDontLie v1 season_averages uses player_ids[] (array param), not player_id
    const [avgRes, recentRes] = await Promise.all([
      fetch(
        `https://api.balldontlie.io/v1/season_averages?player_ids[]=${player.id}&season=${season}`,
        { headers: { Authorization: authHeader }, next: { revalidate: 0 } }
      ),
      (season === 2025 || season === 2024)
        ? fetch(
            `https://api.balldontlie.io/v1/stats?player_ids[]=${player.id}&seasons[]=${season}&per_page=5`,
            { headers: { Authorization: authHeader }, next: { revalidate: 0 } }
          )
        : Promise.resolve(null),
    ]);

    const avgRawBody = await avgRes.text();
    console.log(`[player-stats] BallDontLie season_averages status=${avgRes.status} season=${season} body: ${avgRawBody.slice(0, 300)}`);

    if (!avgRes.ok) {
      console.error(`[player-stats] BallDontLie season_averages failed: ${avgRes.status} season=${season}`);
      continue;
    }

    let avgData: { data?: { pts: number; reb: number; ast: number; fg_pct: number; fg3_pct?: number; stl: number; blk: number; games_played: number }[] };
    try {
      avgData = JSON.parse(avgRawBody);
    } catch {
      console.error(`[player-stats] BallDontLie season_averages JSON parse error season=${season}`);
      continue;
    }

    const avg = avgData.data?.[0];
    if (!avg) {
      console.log(`[player-stats] BallDontLie: no averages for ${player.first_name} ${player.last_name} season ${season}`);
      continue;
    }

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
          const slice  = games.slice(0, 5);
          const l5avg  = slice.reduce((s, g) => s + Number(g.pts), 0) / slice.length;
          const sznPPG = Number(avg.pts);
          const arrow  = l5avg > sznPPG + 2 ? '▲' : l5avg < sznPPG - 2 ? '▼' : '→';
          entries.push({ label: 'L5', value: `${l5avg.toFixed(1)} ${arrow}` });
        }
      } catch { /* best-effort */ }
    }

    const seasonLabel = `${season}-${String(season + 1).slice(2)} SEASON`;
    const fullPlayerName = `${player.first_name} ${player.last_name}`;
    const isKnownActive = KNOWN_ACTIVE.has(norm(playerName)) || KNOWN_ACTIVE.has(norm(fullPlayerName));
    console.log(`[player-stats] BallDontLie: ${entries.length} stats (${seasonLabel})`);
    return {
      playerName: fullPlayerName,
      sport: 'Basketball',
      team: player.team?.full_name,
      season: seasonLabel,
      stats: entries,
      source: 'BallDontLie',
      knownActive: isKnownActive,
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
  const normalizedName = norm(playerName);

  // For known players, skip search and hit stats directly — search often fails in offseason
  const hardcodedId = NFL_ESPN_IDS[normalizedName];
  if (hardcodedId) {
    const result = await fetchNflDirectStats(hardcodedId, playerName);
    if (result) return result;
  }

  // General search path
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

  // 1. Try site API direct stats — works year-round including offseason
  const directResult = await fetchNflDirectStats(athleteId, fullName, team, position);
  if (directResult) return directResult;

  // 2. Fall back to core API (works in-season)
  const wantedByPos: Record<string, string[]> = {
    QB: ['YDS', 'TD', 'INT', 'CMP%', 'QBR', 'RTG', 'PYDS'],
    RB: ['YDS', 'TD', 'AVG', 'CAR', 'RYDS'],
    WR: ['REC', 'YDS', 'TD', 'AVG', 'REYDS'],
    TE: ['REC', 'YDS', 'TD', 'AVG'],
  };
  const wanted = wantedByPos[position] ?? ['YDS', 'TD', 'REC', 'INT', 'AVG'];

  for (const season of [2025, 2024, 2023]) {
    const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/athletes/${athleteId}/statistics/0`;
    const statsRes = await fetch(url, { next: { revalidate: 0 } });
    console.log(`[player-stats] NFL core API ${season} status: ${statsRes.status}`);
    if (!statsRes.ok) continue;

    const statsData = await statsRes.json() as Record<string, unknown>;
    const entries = parseEspnStats(statsData, wanted);

    if (entries.length > 0) {
      console.log(`[player-stats] NFL core API: ${entries.length} stats for ${fullName} (${season})`);
      const injuryStatus = (athlete.injuries as Record<string, string>[] | undefined)?.[0]?.status;
      return {
        playerName: fullName, sport: 'Football', team,
        season: `${season} SEASON`, stats: entries, source: 'ESPN', injuryStatus,
      };
    }
  }

  // Minimum fallback
  const fallback: PlayerStat[] = [];
  if (position) fallback.push({ label: 'POS',  value: position });
  if (team)     fallback.push({ label: 'TEAM', value: team });
  if (fallback.length) {
    return { playerName: fullName, sport: 'Football', team, season: '2024 SEASON', stats: fallback, source: 'ESPN' };
  }
  return null;
}

/**
 * ESPN site API /athletes/{id}/stats — works year-round, returns most recent season.
 * Shape: data.statistics[].splits.categories[].stats[]
 */
async function fetchNflDirectStats(
  athleteId: string,
  playerName: string,
  team?: string,
  position?: string,
): Promise<PlayerStats | null> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${athleteId}/stats`,
    { next: { revalidate: 0 } }
  );
  console.log(`[player-stats] NFL direct stats (site API) status: ${res.status} id=${athleteId}`);
  if (!res.ok) return null;

  const data = await res.json() as Record<string, unknown>;

  const wantedByPos: Record<string, string[]> = {
    QB: ['YDS', 'TD', 'INT', 'CMP%', 'QBR', 'RTG', 'PCT', 'PYDS', 'TDINT'],
    RB: ['YDS', 'TD', 'AVG', 'CAR'],
    WR: ['REC', 'YDS', 'TD', 'AVG'],
    TE: ['REC', 'YDS', 'TD', 'AVG'],
  };
  const pos    = position ?? 'QB';
  const wanted = new Set((wantedByPos[pos] ?? ['YDS', 'TD', 'INT', 'CMP%', 'QBR', 'RTG']).map(w => w.toUpperCase()));

  const entries: PlayerStat[] = [];
  let seasonYear: string | undefined;

  // Walk statistics[].splits.categories[].stats[]
  const statistics = data.statistics as Record<string, unknown>[] | undefined;
  if (statistics?.length) {
    // Try to grab season year from first group
    const yr = ((statistics[0] as Record<string, unknown>).season as Record<string, unknown> | undefined)?.year;
    if (yr) seasonYear = String(yr);

    for (const statGroup of statistics) {
      const sg       = statGroup as Record<string, unknown>;
      const splits   = sg.splits as Record<string, unknown> | undefined;
      // splits may be an embedded object or a $ref — only use it if it has categories
      if (!splits || typeof splits !== 'object' || !('categories' in splits)) continue;
      const cats     = (splits.categories ?? []) as Record<string, unknown>[];
      for (const cat of cats) {
        const stats = (cat as Record<string, unknown>).stats as Record<string, unknown>[] | undefined;
        if (!stats) continue;
        for (const st of stats) {
          const abbr = String(st.abbreviation ?? st.shortDisplayName ?? '').toUpperCase();
          const val  = String(st.displayValue ?? st.value ?? '');
          // Allow '0' for INT (0 interceptions is a valid meaningful stat)
          const skip = !abbr || !val || val === '--' || (val === '0' && abbr !== 'INT');
          if (!skip && wanted.has(abbr) && entries.length < 8) {
            entries.push({ label: abbr, value: val });
          }
        }
      }
    }
  }

  // Flat splits.categories shape (some ESPN responses embed at root level)
  if (entries.length === 0) {
    const moreEntries = parseEspnStats(data, Array.from(wanted));
    entries.push(...moreEntries);
  }

  if (entries.length === 0) {
    console.log(`[player-stats] NFL direct stats: nothing parsed for ${playerName}`);
    return null;
  }

  // Resolve name and team from athlete field if present
  const athleteObj   = data.athlete as Record<string, unknown> | undefined;
  const resolvedName = String(athleteObj?.fullName ?? playerName);
  const resolvedTeam = team ?? extractEspnTeam(athleteObj?.team);
  const seasonLabel  = seasonYear ? `${seasonYear} SEASON` : '2024 SEASON';
  const isKnownActive = KNOWN_ACTIVE.has(norm(playerName)) || KNOWN_ACTIVE.has(norm(resolvedName));

  console.log(`[player-stats] NFL direct stats: ${entries.length} entries for ${resolvedName} (${seasonLabel})`);
  return {
    playerName: resolvedName,
    sport: 'Football',
    team:  resolvedTeam,
    season: seasonLabel,
    stats:  entries,
    source: 'ESPN',
    knownActive: isKnownActive,
  };
}

// ─── NHL via NHL Stats API (statsapi.nhle.com) ────────────────────────────────

async function fetchNhlStats(playerName: string): Promise<PlayerStats | null> {
  // Step 1: search for player by name
  const searchRes = await fetch(
    `https://search.d3.nhle.com/api/v1/search/player?culture=en-us&limit=5&q=${encodeURIComponent(playerName)}&active=true`,
    { next: { revalidate: 0 } }
  );
  console.log(`[player-stats] NHL search status: ${searchRes.status}`);
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json() as Array<{
    playerId: number;
    name: string;
    teamAbbrev?: string;
    positionCode?: string;
  }>;

  if (!searchData.length) {
    // Retry without active filter (retired players)
    const retiredRes = await fetch(
      `https://search.d3.nhle.com/api/v1/search/player?culture=en-us&limit=5&q=${encodeURIComponent(playerName)}`,
      { next: { revalidate: 0 } }
    );
    if (!retiredRes.ok) return null;
    const retiredData = await retiredRes.json() as typeof searchData;
    if (!retiredData.length) return null;
    searchData.push(...retiredData);
  }

  const player = searchData.find((p) => nameMatch(p.name, playerName)) ?? searchData[0];
  console.log(`[player-stats] NHL: matched "${player.name}" id=${player.playerId}`);

  // Step 2: fetch player landing page (season stats)
  const statsRes = await fetch(
    `https://api-web.nhle.com/v1/player/${player.playerId}/landing`,
    { next: { revalidate: 0 } }
  );
  if (!statsRes.ok) return null;

  const statsData = await statsRes.json() as Record<string, unknown>;
  const position = statsData.position as string | undefined;
  const isGoalie = position === 'G';

  // Get most recent season from featuredStats or last season in seasonTotals
  const featured = statsData.featuredStats as Record<string, unknown> | undefined;
  const regularSeason = (featured?.regularSeason as Record<string, unknown> | undefined)?.subSeason as Record<string, unknown> | undefined;

  const entries: PlayerStat[] = [];
  let seasonLabel = 'Current Season';
  let team: string | undefined = player.teamAbbrev;

  if (regularSeason) {
    const season = featured?.season as number | undefined;
    if (season) {
      const yr = String(season);
      seasonLabel = `${yr.slice(0, 4)}-${yr.slice(6)} SEASON`;
    }

    if (isGoalie) {
      push(entries, 'GP',   regularSeason.gamesPlayed);
      push(entries, 'W',    regularSeason.wins);
      push(entries, 'GAA',  regularSeason.goalsAgainstAvg != null ? (regularSeason.goalsAgainstAvg as number).toFixed(2) : null);
      push(entries, 'SV%',  regularSeason.savePctg != null ? (regularSeason.savePctg as number).toFixed(3) : null);
      push(entries, 'SO',   regularSeason.shutouts);
    } else {
      push(entries, 'GP',  regularSeason.gamesPlayed);
      push(entries, 'G',   regularSeason.goals);
      push(entries, 'A',   regularSeason.assists);
      push(entries, 'PTS', regularSeason.points);
      push(entries, '+/-', regularSeason.plusMinus);
    }
  }

  if (entries.length === 0) return null;

  const isRetired = !player.teamAbbrev;
  console.log(`[player-stats] NHL: ${entries.length} stats for ${player.name} (${seasonLabel})`);
  return {
    playerName: player.name,
    sport: 'Hockey',
    team,
    season: seasonLabel,
    stats: entries,
    source: 'NHL API',
    isRetired,
  };
}

// ─── Soccer via ESPN ─────────────────────────────────────────────────────────

async function fetchSoccerStats(playerName: string): Promise<PlayerStats | null> {
  // Try major leagues in order: EPL, La Liga, Bundesliga, Serie A, MLS
  const leagues = [
    { slug: 'eng.1', name: 'Premier League' },
    { slug: 'esp.1', name: 'La Liga' },
    { slug: 'ger.1', name: 'Bundesliga' },
    { slug: 'ita.1', name: 'Serie A' },
    { slug: 'usa.1', name: 'MLS' },
  ];

  for (const league of leagues) {
    try {
      const searchRes = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/athletes` +
        `?search=${encodeURIComponent(playerName)}&limit=5`,
        { next: { revalidate: 0 } }
      );
      if (!searchRes.ok) continue;

      const searchData = await searchRes.json() as { items?: Record<string, unknown>[] };
      const items = searchData.items ?? [];
      if (!items.length) continue;

      const athlete = (
        items.find((a) => nameMatch(String(a.fullName ?? ''), playerName)) ?? items[0]
      ) as Record<string, unknown>;

      const athleteId = String(athlete.id ?? '');
      const fullName  = String(athlete.fullName ?? playerName);
      const team      = extractEspnTeam(athlete.team);
      console.log(`[player-stats] Soccer: matched "${fullName}" in ${league.name} id=${athleteId}`);

      // Fetch current season stats
      for (const season of [2025, 2024]) {
        const statsRes = await fetch(
          `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${league.slug}/seasons/${season}/athletes/${athleteId}/statistics/0`,
          { next: { revalidate: 0 } }
        );
        if (!statsRes.ok) continue;

        const statsData = await statsRes.json() as Record<string, unknown>;
        const entries = parseEspnStats(statsData, ['G', 'A', 'SHT', 'SHOG', 'FC', 'APP', 'GLS', 'AST']);

        if (entries.length > 0) {
          const seasonLabel = `${season - 1}/${String(season).slice(2)} SEASON`;
          console.log(`[player-stats] Soccer: ${entries.length} stats for ${fullName} (${league.name} ${seasonLabel})`);
          return {
            playerName: fullName,
            sport: 'Soccer',
            team: team ? `${team} (${league.name})` : league.name,
            season: seasonLabel,
            stats: entries,
            source: 'ESPN',
          };
        }
      }
    } catch (err) {
      console.warn(`[player-stats] Soccer ${league.slug} failed:`, err instanceof Error ? err.message : String(err));
    }
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

  const entries: PlayerStat[] = [];
  const rank = (athlete.rank as number | undefined) ?? (athlete.worldRanking as number | undefined);
  if (rank) entries.push({ label: 'WR', value: `#${rank}` });

  for (const season of [2025, 2024]) {
    const statsRes = await fetch(
      `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/seasons/${season}/athletes/${athleteId}/statistics/0`,
      { next: { revalidate: 0 } }
    );
    if (!statsRes.ok) continue;

    const statsData    = await statsRes.json() as Record<string, unknown>;
    const seasonEntries = parseEspnStats(
      statsData,
      ['WINS', 'TOP10', 'TOP25', 'CUTS', 'AVG', 'FEDEXPTS', 'EARNINGS', 'EVENTS']
    );

    if (seasonEntries.length > 0 || entries.length > 0) {
      const combined = entries.filter((e) => !seasonEntries.find((s) => s.label === e.label));
      const all = [...combined, ...seasonEntries];
      console.log(`[player-stats] Golf: ${all.length} stats for ${fullName} (${season})`);
      return { playerName: fullName, sport: 'Golf', season: `${season} PGA TOUR`, stats: all, source: 'ESPN' };
    }
  }

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
  if (typeof t.name        === 'string') return t.name;
  return undefined;
}

function push(entries: PlayerStat[], label: string, value: unknown) {
  if (value != null && value !== '') entries.push({ label, value: String(value) });
}
