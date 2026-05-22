import { NextRequest, NextResponse } from 'next/server';
import { dbGetActiveAlerts, initSchema } from '@/lib/db';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

let schemaReady = false;
async function ensureSchema() {
  if (!schemaReady) { await initSchema(); schemaReady = true; }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'alerts', 30);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  try {
    await ensureSchema();
    const alerts = await dbGetActiveAlerts();
    return NextResponse.json({ alerts });
  } catch (err) {
    console.error('[alerts] GET error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ alerts: [] });
  }
}
