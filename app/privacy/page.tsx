import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata = { title: 'Privacy Policy — CardIQ' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060E1C] text-slate-100">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1E2D45] bg-[rgba(6,14,28,0.95)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-[#060E1C] text-xs font-black tracking-tight z-10">IQ</span>
            </div>
            <span className="font-card text-xl tracking-widest chrome-text select-none">CARD<span>IQ</span></span>
          </Link>
          <Link href="/dashboard" className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest">
            Launch App <ChevronRight size={12} />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="font-card text-4xl uppercase tracking-widest text-white mb-2">Privacy Policy</h1>
        <p className="text-chrome-600 text-sm font-sans mb-12">Last updated: May 2026</p>

        <div className="space-y-10 font-sans text-slate-400 leading-relaxed text-sm">

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">1. What we collect</h2>
            <p>When you use CardIQ, we collect:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-2">
              <li><strong className="text-slate-300">Account data</strong> — email address and authentication details via Clerk.</li>
              <li><strong className="text-slate-300">Portfolio data</strong> — the cards you add, including player, year, brand, condition, purchase price, and current value.</li>
              <li><strong className="text-slate-300">Usage data</strong> — pages visited, features used, and API calls made.</li>
              <li><strong className="text-slate-300">Card photos</strong> — images you upload are stored locally in your browser (localStorage) and are not transmitted to our servers.</li>
              <li><strong className="text-slate-300">Waitlist email</strong> — if you submit the email form on our landing page.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">2. How we use it</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To provide the portfolio tracking, AI analysis, and pricing features.</li>
              <li>To send transactional emails (waitlist confirmation, feature updates) via Resend.</li>
              <li>To improve the product based on aggregate usage patterns.</li>
            </ul>
            <p className="mt-3">We do not sell your data. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">3. Third-party services</h2>
            <p>CardIQ uses the following services that may process your data:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-2">
              <li><strong className="text-slate-300">Clerk</strong> — authentication and user management.</li>
              <li><strong className="text-slate-300">Neon</strong> — database hosting for portfolio and signal data.</li>
              <li><strong className="text-slate-300">Vercel</strong> — hosting and serverless compute.</li>
              <li><strong className="text-slate-300">Anthropic</strong> — card identification and AI signal generation. Card descriptions (player name, year, brand) are sent to Anthropic's API. No personal account data is shared.</li>
              <li><strong className="text-slate-300">Resend</strong> — transactional email delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">4. Data retention</h2>
            <p>We retain your portfolio data for as long as your account is active. Price history and AI signals are retained indefinitely to power the self-improvement loop. You can request deletion at any time.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">5. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-2">
              <li>Access the data we hold about you.</li>
              <li>Export your portfolio data in CSV format.</li>
              <li>Request deletion of your account and all associated data.</li>
              <li>Opt out of any non-essential communications.</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">6. Cookies</h2>
            <p>CardIQ uses only essential cookies required for authentication (via Clerk). We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">7. Contact</h2>
            <p>Questions about this policy? Email us at <a href="mailto:maxkoss07@gmail.com" className="text-gold-400 hover:text-gold-300 transition-colors">maxkoss07@gmail.com</a>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#1E2D45] py-8 px-4 text-center">
        <p className="text-chrome-700 text-xs uppercase tracking-widest">
          <Link href="/" className="hover:text-gold-400 transition-colors">CardIQ</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-gold-400 transition-colors">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-gold-400 transition-colors">Terms</Link>
        </p>
      </footer>
    </div>
  );
}
