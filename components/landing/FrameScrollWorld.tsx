'use client';

/**
 * FrameScrollWorld — Apple-style scroll cinematic.
 *
 * NOT a scrubbed <video> (decoder seeking = stutter). Instead a pre-extracted
 * sequence of WebP frames (/world/seq/f_###.webp) drawn to a <canvas>, one frame
 * per scroll position. No decode-on-seek → genuinely smooth. The frames are one
 * continuous journey through all 6 CardIQ rooms (stitched with dissolves), so
 * scrolling flies through the whole world seamlessly.
 *
 * Pin = CSS sticky stage inside a tall section (no JS pinning). Scroll progress
 * maps to a frame index (rAF-lerped for silk); per-room copy fades in over its
 * slice of the journey.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';

const FRAME_COUNT = 314;            // must match the extracted /world/seq count
const SCROLL_VH = 720;             // total scroll height for the journey (in vh)
const framePath = (i: number) => `/world/seq/f_${String(i + 1).padStart(3, '0')}.webp`;

type Section = {
  id: string; accent: string; eyebrow: string; title: string; body: string;
  tags?: string[]; cta?: { primary: { label: string; href: string }; secondary?: { label: string; href: string } };
};

const GOLD = '#F5C842';
const CYAN = '#4FD8FF';

const SECTIONS: Section[] = [
  { id: 'shoebox', accent: GOLD, eyebrow: 'Every collection starts here',
    title: 'Your cards are worth more than you think',
    body: 'Most collectors are flying blind on what they actually own. CardIQ turns the shoebox into a portfolio.' },
  { id: 'scan', accent: CYAN, eyebrow: 'Scan', title: 'Point. Scan. Know.',
    body: 'Instant AI identification and a live market price for any card — in seconds, from a single photo.',
    tags: ['AI identify', 'Live comps'] },
  { id: 'grade', accent: GOLD, eyebrow: 'Authenticate', title: 'Grade-aware from the first look',
    body: 'Condition, population reports, and real sales comps folded into every valuation.',
    tags: ['PSA / BGS pop', 'Condition-adjusted'] },
  { id: 'vault', accent: GOLD, eyebrow: 'Track', title: 'Your whole collection, one vault',
    body: 'Every card tracked, valued, and moving in real time — so you always know what you are holding.',
    tags: ['Real-time value', 'Portfolio view'] },
  { id: 'signal', accent: CYAN, eyebrow: 'Signal', title: 'Buy, hold, or sell — decided',
    body: 'CardIQ reads the market and tells you when to move, with the reasoning behind every call.',
    tags: ['Buy / Hold / Sell', 'Price alerts'] },
  { id: 'dashboard', accent: GOLD, eyebrow: 'Launch', title: 'Start tracking smarter today',
    body: 'Join collectors using CardIQ to make better buy and sell decisions.',
    cta: { primary: { label: 'Launch App Free', href: '/dashboard' }, secondary: { label: 'See Pricing', href: '/pricing' } } },
];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };

export default function FrameScrollWorld() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<(HTMLButtonElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- preload frames (progressive; first frames land fastest for the hero) ----
    const imgs: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    const loaded: boolean[] = new Array(FRAME_COUNT).fill(false);
    let firstReady = false;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { loaded[i] = true; if (!firstReady) { firstReady = true; render(true); } };
      im.src = framePath(i);
      imgs[i] = im;
    }
    const nearestLoaded = (idx: number) => {
      if (loaded[idx]) return idx;
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (idx - d >= 0 && loaded[idx - d]) return idx - d;
        if (idx + d < FRAME_COUNT && loaded[idx + d]) return idx + d;
      }
      return -1;
    };

    // ---- canvas sizing (DPR-aware, object-fit: cover) ----
    let vw = 0, vh = 0, dpr = 1;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth; vh = window.innerHeight;
      canvas!.width = Math.round(vw * dpr); canvas!.height = Math.round(vh * dpr);
      canvas!.style.width = vw + 'px'; canvas!.style.height = vh + 'px';
    }
    function drawCover(img: HTMLImageElement) {
      const cw = canvas!.width, ch = canvas!.height;
      const ir = img.width / img.height, cr = cw / ch;
      let dw = cw, dh = ch, dx = 0, dy = 0;
      if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; }
      else { dw = cw; dh = cw / ir; dy = (ch - dh) / 2; }
      ctx!.drawImage(img, dx, dy, dw, dh);
    }

    // ---- scroll → frame (rAF-lerped) + copy fades ----
    let targetF = 0, curF = 0, activeRoom = -1;
    function progress() {
      const rect = wrap!.getBoundingClientRect();
      const total = rect.height - vh;
      return total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    }
    function updateCopy(p: number) {
      const N = SECTIONS.length;
      let near = Math.round(p * (N - 1));
      for (let i = 0; i < N; i++) {
        const c = (i + 0.5) / N;      // room center in journey progress
        const half = 1 / N;
        let op: number;
        if (i === 0) op = p <= c ? 1 : smooth(1 - (p - c) / half);
        else if (i === N - 1) op = p >= c ? 1 : smooth(1 - (c - p) / half);
        else op = smooth(1 - Math.abs(p - c) / half);
        const el = copyRefs.current[i];
        if (el) {
          el.style.opacity = String(op);
          el.style.transform = reduce ? 'none' : `translateY(${(0.5 - clamp((p - (c - half)) / (2 * half))) * 26}px)`;
          el.style.pointerEvents = op > 0.6 ? 'auto' : 'none';
        }
      }
      near = clamp(near, 0, N - 1);
      if (near !== activeRoom) {
        activeRoom = near;
        railRef.current.forEach((d, k) => d && d.classList.toggle('is-on', k === near));
      }
      if (hintRef.current) hintRef.current.style.opacity = String(clamp(1 - p * 12));
    }

    let raf = 0, running = true;
    function render(force = false) {
      const p = progress();
      targetF = p * (FRAME_COUNT - 1);
      curF += (targetF - curF) * (reduce ? 1 : 0.18);
      if (force) curF = targetF;
      const idx = nearestLoaded(Math.round(curF));
      if (idx >= 0 && imgs[idx]) drawCover(imgs[idx]!);
      updateCopy(p);
    }
    function loop() { if (!running) return; render(); raf = requestAnimationFrame(loop); }

    size();
    render(true);
    loop();
    const onResize = () => { size(); render(true); };
    window.addEventListener('resize', onResize);

    return () => {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const jumpToRoom = (i: number) => {
    const wrap = wrapRef.current; if (!wrap) return;
    const total = wrap.offsetHeight - window.innerHeight;
    const p = (i + 0.5) / SECTIONS.length;
    window.scrollTo({ top: wrap.offsetTop + p * total, behavior: 'smooth' });
  };

  return (
    <section ref={wrapRef} style={{ height: `${SCROLL_VH}vh`, position: 'relative', background: '#060E1C' }}>
      {/* pinned stage */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

        {/* vignette for copy legibility */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'radial-gradient(ellipse 90% 80% at 30% 60%, rgba(6,14,28,0.55) 0%, transparent 60%), linear-gradient(0deg, rgba(6,14,28,0.7) 0%, transparent 32%)',
        }} />

        {/* per-room copy */}
        {SECTIONS.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => { copyRefs.current[i] = el; }}
            className="absolute left-0 right-0 bottom-[14vh] px-6 sm:px-10 lg:px-16"
            style={{ opacity: 0, willChange: 'opacity, transform' }}
          >
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] mb-4" style={{ color: s.accent }}>{s.eyebrow}</p>
              <h2 className="font-card uppercase tracking-wide leading-[1.02] text-4xl sm:text-5xl lg:text-6xl mb-4"
                  style={{ color: '#F4F8FF', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>
                {s.title}
              </h2>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-5 max-w-lg">{s.body}</p>
              {s.tags && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {s.tags.map((t) => (
                    <span key={t} className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                          style={{ border: `1px solid ${s.accent}55`, color: s.accent, background: 'rgba(6,14,28,0.4)', backdropFilter: 'blur(6px)' }}>{t}</span>
                  ))}
                </div>
              )}
              {s.cta && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={s.cta.primary.href} className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-3.5 font-black text-xs uppercase tracking-widest">
                    {s.cta.primary.label}
                  </Link>
                  {s.cta.secondary && (
                    <Link href={s.cta.secondary.href} className="btn-ghost inline-flex items-center justify-center gap-2 px-8 py-3.5 font-bold text-xs uppercase tracking-widest">
                      {s.cta.secondary.label}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* route rail */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => { railRef.current[i] = el; }}
              onClick={() => jumpToRoom(i)}
              aria-label={s.id}
              className="sw-dot w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            />
          ))}
        </div>

        {/* scroll hint */}
        <div ref={hintRef} className="absolute left-1/2 -translate-x-1/2 bottom-6 text-[10px] uppercase tracking-[0.3em] text-slate-400 flex flex-col items-center gap-2">
          <span>scroll to fly in</span>
          <span className="block w-px h-6 bg-gradient-to-b from-gold-400 to-transparent" />
        </div>
      </div>

      {/* crawlable copy mirror */}
      <div data-sw-seo className="sr-only">
        <h1>CardIQ — your trading-card collection, valued and tracked in real time</h1>
        {SECTIONS.map((s) => (<section key={s.id}><h2>{s.title}</h2><p>{s.body}</p></section>))}
        <a href="/dashboard">Launch the CardIQ app</a>
      </div>

      <style>{`.sw-dot.is-on{background:${GOLD} !important;box-shadow:0 0 12px ${GOLD};transform:scale(1.5);}`}</style>
    </section>
  );
}
