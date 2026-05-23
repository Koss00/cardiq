'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function EmailForm() {
  const [email, setEmail]       = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (email) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-6 py-3.5 rounded-md text-sm font-semibold">
        <CheckCircle size={16} />
        You&apos;re on the list — we&apos;ll be in touch soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        required
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-[#111D33] border border-[rgba(245,200,66,0.2)] text-white rounded-md px-4 py-3 text-sm placeholder-chrome-600 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/20 transition-all duration-200"
        aria-label="Email address for waitlist"
      />
      <button
        type="submit"
        className="btn-gold px-7 py-3 text-sm uppercase tracking-widest whitespace-nowrap font-black"
      >
        Join Waitlist
      </button>
    </form>
  );
}
