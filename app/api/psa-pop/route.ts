import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, validateCertNumber } from '@/lib/security';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const PSA_FILE  = path.join(CACHE_DIR, 'psa-certs.json');
const TTL_MS    = 48 * 60 * 60 * 1000;

interface PsaEntry {
  data: PsaCertData | null;
  cachedAt: string;
}

export interface PsaCertData {
  certNumber: string;
  grade: string;
  subject: string;
  year: string;
  brand: string;
  cardNumber: string;
  variety?: string;
  isPsaAuthentic: boolean;
}

function readCache(): Record<string, PsaEntry> {
  try { return JSON.parse(fs.readFileSync(PSA_FILE, 'utf-8')); }
  catch { return {}; }
}

function writeCache(cache: Record<string, PsaEntry>) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(PSA_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'psa-pop', 20);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const rawCert = new URL(req.url).searchParams.get('cert')?.trim();
  const certResult = validateCertNumber(rawCert);
  if (!certResult.ok) {
    return NextResponse.json({ error: certResult.error }, { status: 400 });
  }
  const cert = certResult.value;

  const cache = readCache();
  const hit   = cache[cert];
  if (hit && Date.now() - new Date(hit.cachedAt).getTime() < TTL_MS) {
    return NextResponse.json({ data: hit.data, fromCache: true });
  }

  try {
    const res = await fetch(
      `https://api.psacard.com/publicapi/cert/GetByCertNumber/${cert}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } }
    );

    if (!res.ok) {
      console.warn(`[psa-pop] HTTP ${res.status} for cert ${cert}`);
      cache[cert] = { data: null, cachedAt: new Date().toISOString() };
      writeCache(cache);
      return NextResponse.json({ data: null, error: 'PSA lookup failed.' });
    }

    const raw = await res.json() as Record<string, unknown>;
    const c = raw.PSACert as Record<string, string> | undefined;

    if (!c) {
      cache[cert] = { data: null, cachedAt: new Date().toISOString() };
      writeCache(cache);
      return NextResponse.json({ data: null });
    }

    const data: PsaCertData = {
      certNumber:    cert,
      grade:         c.GradeDescription ?? c.CardGrade ?? '?',
      subject:       c.Subject ?? c.Name ?? '?',
      year:          c.Year ?? '?',
      brand:         c.Brand ?? '?',
      cardNumber:    c.CardNumber ?? '?',
      variety:       c.Variety || undefined,
      isPsaAuthentic: true,
    };

    cache[cert] = { data, cachedAt: new Date().toISOString() };
    writeCache(cache);
    return NextResponse.json({ data });

  } catch (err) {
    console.error('[psa-pop] fetch failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ data: null, error: 'PSA API unavailable.' });
  }
}
