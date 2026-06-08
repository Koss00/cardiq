'use client';

/**
 * SignalPrefetcher — invisible background component.
 *
 * Fires /api/signals for every card as soon as the store hydrates (1.5 s delay
 * to yield priority to the current page), then immediately for any newly added card.
 *
 * Two things happen for each completed signal:
 *   1. Server persists it to card_signals (DB cache — survives cold starts / instances).
 *   2. We dispatch ADD_SIGNAL to the Zustand store so the Intelligence page can render
 *      instantly without any HTTP requests at all.
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import type { Card, CardSignal } from '@/types';

async function warmSignal(
  card: Card,
  onDone: (signal: CardSignal) => void,
): Promise<void> {
  try {
    const res = await fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card }),
    });
    if (!res.ok || !res.body) return;

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop() ?? '';
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'done' && evt.signal) onDone(evt.signal as CardSignal);
        } catch { /* skip malformed chunk */ }
      }
    }
  } catch { /* best-effort — never surfaces to the user */ }
}

export default function SignalPrefetcher() {
  const { state: { cards }, dispatch } = useStore();
  const warmedRef = useRef<Set<string>>(new Set());
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const newCards = cards.filter((c) => !warmedRef.current.has(c.id));
    if (newCards.length === 0) return;

    const isFirstBatch = warmedRef.current.size === 0;
    newCards.forEach((c) => warmedRef.current.add(c.id));

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      newCards.forEach((card) =>
        void warmSignal(card, (signal) => {
          dispatch({ type: 'ADD_SIGNAL', signal });
        }),
      );
    }, isFirstBatch ? 1500 : 0); // yield to current-page requests on first load

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cards, dispatch]);

  return null;
}
