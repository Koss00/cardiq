'use client';

/**
 * MetricsCounters — honest product facts that count up when scrolled into
 * view. No invented user counts or revenue claims: these are all real
 * properties of the product.
 */

import { useEffect, useRef, useState } from 'react';

const METRICS = [
  { prefix: '<', value: 3, suffix: 's', label: 'per card scan' },
  { prefix: '', value: 90, suffix: '-day', label: 'price history on every card' },
  { prefix: '', value: 24, suffix: '/7', label: 'live eBay market pricing' },
];

function Counter({ prefix, value, suffix, run }: { prefix: string; value: number; suffix: string; run: boolean }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const k = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(eased * value));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);

  return (
    <span className="font-card text-6xl sm:text-7xl title-gold tabular-nums">
      {prefix}{n}{suffix}
    </span>
  );
}

export default function MetricsCounters() {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRun(true); // render final values instantly
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
        {METRICS.map((m) => (
          <div key={m.label}>
            <Counter prefix={m.prefix} value={m.value} suffix={m.suffix} run={run} />
            <p className="text-slate-500 text-sm font-sans uppercase tracking-widest mt-3">{m.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
