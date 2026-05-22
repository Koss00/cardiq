import { NextRequest, NextResponse } from 'next/server';
import { dbDismissAlert } from '@/lib/db';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'alerts-dismiss', 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    await dbDismissAlert(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[alerts] PATCH dismiss error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
