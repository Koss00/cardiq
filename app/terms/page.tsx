import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata = { title: 'Terms of Service — CardIQ' };

export default function TermsPage() {
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
        <h1 className="font-card text-4xl uppercase tracking-widest text-white mb-2">Terms of Service</h1>
        <p className="text-chrome-600 text-sm font-sans mb-12">Last updated: May 2026</p>

        <div className="space-y-10 font-sans text-slate-400 leading-relaxed text-sm">

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using CardIQ, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service. We reserve the right to update these terms at any time; continued use constitutes acceptance of any changes.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">2. Description of Service</h2>
            <p>CardIQ is a sports card portfolio tracking application that provides:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-2">
              <li>AI-powered card identification via photo upload.</li>
              <li>Portfolio value tracking using live eBay market data.</li>
              <li>AI-generated market signals (buy, sell, or hold recommendations).</li>
              <li>Price history and alert notifications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">3. Not Financial Advice</h2>
            <p>All content on CardIQ, including AI-generated signals, price estimates, and market analysis, is provided for <strong className="text-slate-300">informational and entertainment purposes only</strong>. Nothing on this platform constitutes financial, investment, or trading advice.</p>
            <p className="mt-3">Sports card values are highly speculative and can decrease significantly. Past signal performance is not indicative of future results. Always conduct your own research before making any buying or selling decisions.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">4. User Accounts</h2>
            <p>You must create an account to use CardIQ. You are responsible for:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-2">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activity that occurs under your account.</li>
              <li>Notifying us immediately of any unauthorized account access.</li>
            </ul>
            <p className="mt-3">Authentication is handled by Clerk. You must be at least 13 years old to create an account.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-2">
              <li>Use CardIQ for any unlawful purpose or in violation of any regulations.</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the platform's APIs.</li>
              <li>Upload content that is illegal, harmful, or infringes on third-party rights.</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data.</li>
              <li>Use automated bots or scripts to generate excessive API requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">6. Intellectual Property</h2>
            <p>CardIQ and its original content, features, and functionality are owned by CardIQ and are protected by applicable intellectual property laws. You retain ownership of the portfolio data you input. By uploading content, you grant CardIQ a limited license to process and display that content solely to provide the service.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">7. Third-Party Services</h2>
            <p>CardIQ integrates with third-party services including eBay, Anthropic, Clerk, Neon, and Resend. Your use of these services is also subject to their respective terms of service. We are not responsible for the accuracy of third-party data, including eBay pricing information.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">8. Disclaimers and Limitation of Liability</h2>
            <p>CardIQ is provided "as is" without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that price data will be accurate or current.</p>
            <p className="mt-3">To the maximum extent permitted by law, CardIQ shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including any financial losses resulting from reliance on AI-generated signals.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">9. Termination</h2>
            <p>We may suspend or terminate your account at our discretion if you violate these terms. You may terminate your account at any time by contacting us. Upon termination, your right to use the service ceases immediately, though we may retain certain data as required by law or as described in our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">10. Governing Law</h2>
            <p>These terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with applicable rules, except that either party may seek injunctive relief in a court of competent jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-white font-display font-black uppercase tracking-widest text-base mb-3">11. Contact</h2>
            <p>Questions about these terms? Email us at <a href="mailto:maxkoss07@gmail.com" className="text-gold-400 hover:text-gold-300 transition-colors">maxkoss07@gmail.com</a>.</p>
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
