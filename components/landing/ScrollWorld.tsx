'use client';

/**
 * ScrollWorld — mounts the portable scroll-scrubbed camera-flight engine
 * (components/landing/world/scrubEngine.js) as the CardIQ landing "world".
 *
 * The engine owns its own scroll → video.currentTime scrubbing with rAF
 * smoothing and builds its own DOM, so we do NOT wrap it in Lenis (that would
 * fight the scrub). It falls back to the stills (cross-dissolving) whenever a
 * clip is missing / prefers-reduced-motion / data-saver — so this renders fine
 * before the video legs are encoded, then upgrades automatically once the
 * /world/vid/*.mp4 files exist.
 *
 * Seam model (architecture-A wiring): section i's `clip` is the leg that flies
 * INTO room i (leg_{i-1}); section 0 opens on its still. Every seam is frame-
 * locked because leg_{i-1} ends on room i's still and section i+1's clip starts
 * on that same still.
 */

import { useEffect, useRef } from 'react';
// Side-effect import: the engine assigns window.mountScrollWorld on load.
import './world/scrubEngine.js';

type Section = {
  id: string;
  label: string;
  still: string;
  poster?: string;
  clip?: string;
  accent: string;
  eyebrow: string;
  title: string;
  body: string;
  tags?: string[];
  scroll?: number;
  linger?: number;
  cta?: { primary: { label: string; href: string }; secondary?: { label: string; href: string } };
};

const NAVY = '#060E1C';
const GOLD = '#F5C842';
const CYAN = '#4FD8FF';

// Each section is one room with its OWN start-frame-only "dive" clip (a coherent
// forward push-in within that room — no morph). The engine dissolves between rooms
// via a wide crossfade, so the flight reads as continuous and stays smooth.
const SECTIONS: Section[] = [
  {
    id: 'shoebox', label: 'The Shoebox', accent: GOLD,
    still: '/world/stills/00-shoebox.png',
    poster: '/world/posters/shoebox.jpg',
    clip: '/world/vid/shoebox.mp4',
    eyebrow: 'Every collection starts here',
    title: 'Your cards are worth more than you think',
    body: 'Most collectors are flying blind on what they actually own. CardIQ turns the shoebox into a portfolio.',
    scroll: 1.4,
  },
  {
    id: 'scan', label: 'Scan', accent: CYAN,
    still: '/world/stills/01-scan.png',
    poster: '/world/posters/scan.jpg',
    clip: '/world/vid/scan.mp4',
    eyebrow: 'Scan',
    title: 'Point. Scan. Know.',
    body: 'Instant AI identification and a live market price for any card — in seconds, from a single photo.',
    tags: ['AI identify', 'Live comps'],
    scroll: 1.5,
  },
  {
    id: 'grade', label: 'Authenticate', accent: GOLD,
    still: '/world/stills/02-grade.png',
    poster: '/world/posters/grade.jpg',
    clip: '/world/vid/grade.mp4',
    eyebrow: 'Authenticate',
    title: 'Grade-aware from the first look',
    body: 'Condition, population reports, and real sales comps folded into every valuation.',
    tags: ['PSA / BGS pop', 'Condition-adjusted'],
    scroll: 1.5,
  },
  {
    id: 'vault', label: 'Track', accent: GOLD,
    still: '/world/stills/03-vault.png',
    poster: '/world/posters/vault.jpg',
    clip: '/world/vid/vault.mp4',
    eyebrow: 'Track',
    title: 'Your whole collection, one vault',
    body: 'Every card tracked, valued, and moving in real time — so you always know what you are holding.',
    tags: ['Real-time value', 'Portfolio view'],
    scroll: 1.8, linger: 0.45,
  },
  {
    id: 'signal', label: 'Signal', accent: CYAN,
    still: '/world/stills/04-signal.png',
    poster: '/world/posters/signal.jpg',
    clip: '/world/vid/signal.mp4',
    eyebrow: 'Signal',
    title: 'Buy, hold, or sell — decided',
    body: 'CardIQ reads the market and tells you when to move, with the reasoning behind every call.',
    tags: ['Buy / Hold / Sell', 'Price alerts'],
    scroll: 1.6,
  },
  {
    id: 'dashboard', label: 'Launch', accent: GOLD,
    still: '/world/stills/05-dashboard.png',
    poster: '/world/posters/dashboard.jpg',
    clip: '/world/vid/dashboard.mp4',
    eyebrow: 'Launch',
    title: 'Start tracking smarter today',
    body: 'Join collectors using CardIQ to make better buy and sell decisions.',
    scroll: 1.7, linger: 0.5,
    cta: {
      primary: { label: 'Launch App Free', href: '/dashboard' },
      secondary: { label: 'See Pricing', href: '/pricing' },
    },
  },
];

declare global {
  interface Window { mountScrollWorld?: (el: HTMLElement, cfg: unknown) => void; }
}

export default function ScrollWorld() {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || mounted.current) return;
    // Guard against React StrictMode / HMR double-invocation: the engine has no
    // destroy handle, so a second mount would duplicate the track + fight the scroll.
    if (el.querySelector('.sw-stage')) return;
    if (!window.mountScrollWorld) return;
    mounted.current = true;
    window.mountScrollWorld(el, {
      brand: { name: 'CARDIQ', href: '#top' },
      diveScroll: 1.35,
      crossfade: 0.32,  // generous dissolve between rooms — each dive is smooth within a room,
                        // the crossfade carries the room-to-room transition
      hint: 'scroll to fly in',
      nav: true,
      atmosphere: true,
      sections: SECTIONS,
      connectors: [], // architecture-A: legs are the section clips; no aerial connectors
    });
  }, []);

  return (
    <div
      id="world"
      ref={ref}
      style={
        {
          '--sw-bg': NAVY,
          '--sw-ink': '#F1F5FF',
          '--sw-ink-soft': 'rgba(203,213,225,0.72)',
          '--sw-accent': GOLD,
        } as React.CSSProperties
      }
    >
      {/* Crawlable copy mirror — engine hides this on mount (see SKILL Step 7 / SEO). */}
      <div data-sw-seo>
        <h1>CardIQ — your trading-card collection, valued and tracked in real time</h1>
        {SECTIONS.map((s) => (
          <section key={s.id}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <a href="/dashboard">Launch the CardIQ app</a>
        <a href="/pricing">See pricing</a>
      </div>
    </div>
  );
}
