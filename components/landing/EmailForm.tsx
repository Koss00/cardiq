'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function EmailForm() {
  const [email, setEmail]         = useState('');
  const [status, setStatus]       = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [position, setPosition]   = useState<number | null>(null);
  const [alreadyIn, setAlreadyIn] = useState(false);

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { ok: boolean; position?: number; alreadyJoined?: boolean };
      if (!res.ok || !data.ok) throw new Error();
      setPosition(data.position ?? null);
      setAlreadyIn(data.alreadyJoined ?? false);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-6 py-4 rounded-md text-sm font-semibold text-center">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} />
          {alreadyIn
            ? "You're already on the list — we'll be in touch soon."
            : "You're on the list — check your inbox for a confirmation!"}
        </div>
        {position && !alreadyIn && (
          <p className="text-[11px] text-emerald-500/70 font-display uppercase tracking-widest">
            #{position} on the waitlist
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          className="flex-1 bg-[#111D33] border border-[rgba(245,200,66,0.2)] text-white rounded-md px-4 py-3 text-sm placeholder-chrome-600 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/20 transition-all duration-200 disabled:opacity-60"
          aria-label="Email address for waitlist"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-gold px-7 py-3 text-sm uppercase tracking-widest whitespace-nowrap font-black disabled:opacity-60 flex items-center gap-2 justify-center"
        >
          {status === 'loading'
            ? <><Loader2 size={14} className="animate-spin" /> Joining...</>
            : 'Join Waitlist'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-400 text-xs text-center font-display">
          Something went wrong — please try again.
        </p>
      )}
    </div>
  );
}
