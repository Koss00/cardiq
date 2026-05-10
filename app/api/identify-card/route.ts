import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { hashImage, getCachedScan, setCachedScan } from '@/lib/cache';

const client = new Anthropic();

type AnthropicImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function normalizeMediaType(raw: string): AnthropicImageMediaType {
  if (raw === 'image/jpg') return 'image/jpeg';
  const valid: AnthropicImageMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return valid.includes(raw as AnthropicImageMediaType)
    ? (raw as AnthropicImageMediaType)
    : 'image/jpeg';
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();

    if (!imageBase64 || !mediaType) {
      return NextResponse.json(
        { error: 'imageBase64 and mediaType are required' },
        { status: 400 }
      );
    }

    // ── Cache check ──────────────────────────────────────────────────────────
    const imageHash = hashImage(imageBase64);
    const cached = getCachedScan(imageHash);
    if (cached) {
      console.log(`[cache] scan hit: ${imageHash}`);
      return NextResponse.json({ ...cached as object, fromCache: true });
    }

    // ── Anthropic vision call ─────────────────────────────────────────────────
    console.log(`[cache] scan miss: ${imageHash} — calling Anthropic`);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: normalizeMediaType(mediaType),
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `You are an expert sports card authenticator and grader. Analyze this card image carefully and return a JSON object with these exact fields:
{
  "player": "Full player name",
  "year": 2023,
  "brand": "Card manufacturer (Topps, Panini, Upper Deck, Bowman, Fleer, Donruss, Score, etc.)",
  "cardNumber": "Card number if visible, otherwise null",
  "variation": "Special variation such as Rookie Card, Refractor, Prizm, Chrome, Auto, Patch, Holo, Gold, etc. or null if base",
  "sport": "Baseball|Basketball|Football|Hockey|Soccer|Golf",
  "condition": "Estimated raw condition: Mint|Near Mint|Excellent|Good|Poor",
  "confidence": 90,
  "description": "One sentence description of the card highlighting what makes it notable"
}

Return ONLY valid JSON. No markdown, no explanation — just the JSON object.`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '{}';
    const card = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

    // ── Store in cache ────────────────────────────────────────────────────────
    const cardKey = `${card.player} | ${card.year} | ${card.brand}`;
    setCachedScan(imageHash, card, cardKey);
    console.log(`[cache] scan stored: "${cardKey}"`);

    return NextResponse.json({ ...card, fromCache: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('identify-card error:', message);
    return NextResponse.json(
      { error: `Failed to identify card: ${message}` },
      { status: 500 }
    );
  }
}
