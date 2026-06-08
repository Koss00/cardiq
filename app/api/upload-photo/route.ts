import { put } from '@vercel/blob';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, 'upload', 20);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const formData = await req.formData();
  const file     = formData.get('file') as File | null;
  const cardId   = formData.get('cardId') as string | null;

  if (!file || !cardId) return new Response('Missing file or cardId', { status: 400 });
  if (!file.type.startsWith('image/')) return new Response('Invalid file type', { status: 400 });
  if (file.size > 8 * 1024 * 1024) return new Response('File too large (max 8 MB)', { status: 413 });

  const ext  = file.type === 'image/png' ? 'png' : 'jpg';
  const blob = await put(`cards/${userId}/${cardId}.${ext}`, file, {
    access:      'public',
    contentType: file.type,
    // overwrite if the card's photo is replaced
    addRandomSuffix: false,
  });

  return Response.json({ url: blob.url });
}
