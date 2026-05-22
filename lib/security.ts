import type { NextRequest } from 'next/server';

// ~10 MB in base64 chars (base64 inflates by ~1.37×)
export const MAX_BASE64_CHARS = Math.ceil(10 * 1024 * 1024 * 1.37);

const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// ── Image validation ─────────────────────────────────────────────────────────

export function validateImageInput(
  base64: unknown,
  mediaType: unknown,
): { ok: true } | { ok: false; error: string } {
  if (typeof base64 !== 'string' || typeof mediaType !== 'string') {
    return { ok: false, error: 'Invalid image data.' };
  }
  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return { ok: false, error: 'Only JPEG, PNG, and WebP images are supported.' };
  }
  if (base64.length > MAX_BASE64_CHARS) {
    return { ok: false, error: 'Image exceeds the 10 MB size limit.' };
  }
  return { ok: true };
}

// ── EXIF stripping ───────────────────────────────────────────────────────────
// Removes APP1 (EXIF) segments from JPEG data encoded as base64.
// For non-JPEG types the input is returned unchanged.

export function stripExifFromBase64(base64: string, mediaType: string): string {
  if (mediaType !== 'image/jpeg') return base64;

  const binary = Buffer.from(base64, 'base64');
  const result: number[] = [];
  let i = 0;

  // Verify JPEG SOI marker
  if (binary[0] !== 0xff || binary[1] !== 0xd8) return base64;
  result.push(0xff, 0xd8);
  i = 2;

  while (i < binary.length) {
    if (binary[i] !== 0xff) break;
    const marker = binary[i + 1];
    // SOS — image data starts; copy remainder verbatim
    if (marker === 0xda) {
      for (let j = i; j < binary.length; j++) result.push(binary[j]);
      break;
    }
    const segLen = (binary[i + 2] << 8) | binary[i + 3];
    // APP1 (0xe1) = EXIF — skip this segment
    if (marker === 0xe1) {
      i += 2 + segLen;
      continue;
    }
    for (let j = i; j < i + 2 + segLen; j++) result.push(binary[j]);
    i += 2 + segLen;
  }

  return Buffer.from(result).toString('base64');
}

// ── Text sanitization ────────────────────────────────────────────────────────

// Removes control characters and common prompt-injection punctuation chains.
export function sanitizeCardField(value: unknown, maxLen = 300): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\x00-\x1f\x7f]/g, '')   // strip control chars
    .replace(/[<>{}[\]\\]/g, '')         // strip HTML/template chars
    .slice(0, maxLen)
    .trim();
}

export function validateQuery(
  raw: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { ok: false, error: 'Query is required.' };
  }
  const value = raw.trim().slice(0, 500);
  return { ok: true, value };
}

export function validateCertNumber(
  raw: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Invalid certificate number.' };
  const trimmed = raw.trim();
  if (!/^\d{1,12}$/.test(trimmed)) {
    return { ok: false, error: 'Certificate number must be numeric (up to 12 digits).' };
  }
  return { ok: true, value: trimmed };
}

// ── IP extraction ────────────────────────────────────────────────────────────

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

// ── Safe logging ─────────────────────────────────────────────────────────────

export function maskSecret(value: string, showChars = 4): string {
  if (value.length <= showChars) return '****';
  return value.slice(0, showChars) + '****';
}

// ── Startup env check ─────────────────────────────────────────────────────────

export function requireEnvVars(): void {
  const required = ['ANTHROPIC_API_KEY', 'EBAY_APP_ID', 'EBAY_CERT_ID'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
