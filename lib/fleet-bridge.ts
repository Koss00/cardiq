// Writes CardIQ signal data to AGENTS/MARKET/inbox/ for the MARKET agent.
// No-ops when FLEET_DIR is unset (Vercel production) — fleet is local-only.
import fs from 'fs';
import path from 'path';

export interface CardiqExport {
  player: string;
  card: string;          // e.g. "2021 Prizm Luka Doncic PSA 10"
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  priceTarget?: number;
  summary: string;
  marketHeatScore?: number;
  wyckoffRegime?: string;
  evPerDollar?: number;
}

const stamp = () => new Date().toISOString().slice(0, 10);

/**
 * Read HAWK's latest outbox and return ≥70% picks as a comma-separated string.
 * These are "CardIQ cross-signals" — picks where HAWK's confidence hit the threshold
 * that also signals relevant player card activity. Used by signals/route.ts to inject
 * sports-pick context into card analysis.
 * No-ops when FLEET_DIR is unset (Vercel production).
 */
export function readHawkPicks(): string {
  const fleetDir = process.env.FLEET_DIR;
  if (!fleetDir) return '';
  try {
    const dir = path.join(path.resolve(fleetDir), 'HAWK', 'outbox');
    if (!fs.existsSync(dir)) return '';
    // Read the last 2 outbox files so today's + yesterday's picks are both visible.
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .sort().reverse().slice(0, 2);
    const picks: string[] = [];
    for (const f of files) {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const match = content.match(/\*\*CardIQ cross-signals \(≥70%\):\*\*\s*(.+)/);
      if (match) picks.push(...match[1].split(',').map(s => s.trim()).filter(Boolean));
    }
    return picks.join(', ');
  } catch (e) {
    console.warn('[fleet-bridge] readHawkPicks failed:', (e as Error).message);
    return '';
  }
}

export function publishToMarket(data: CardiqExport): void {
  const fleetDir = process.env.FLEET_DIR;
  if (!fleetDir) return; // no-op on Vercel

  try {
    const dir = path.join(path.resolve(fleetDir), 'MARKET', 'inbox');
    fs.mkdirSync(dir, { recursive: true });
    const slug = data.player.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const file = path.join(dir, `${stamp()}-cardiq-${slug}-${Date.now()}.md`);
    const fm = [
      '---',
      'from: CARDIQ',
      'to: MARKET',
      'type: data',
      `created: ${stamp()}`,
      `re: CardIQ signal ${data.player}`,
      '---',
    ].join('\n') + '\n';
    fs.writeFileSync(file, `${fm}\n${JSON.stringify(data, null, 2)}\n`);
  } catch (e) {
    console.warn('[fleet-bridge] skipped:', (e as Error).message);
  }
}
