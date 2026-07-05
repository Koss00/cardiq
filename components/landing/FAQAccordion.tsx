'use client';

/**
 * FAQAccordion — five questions, answers grounded in what the product
 * actually claims elsewhere (no new promises invented here).
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Does CardIQ work with graded cards?',
    a: 'Yes — the scanner identifies both raw cards and graded slabs (PSA, BGS, SGC). Grade and cert details factor into pricing and signals.',
  },
  {
    q: 'How accurate is the pricing?',
    a: 'Values come from live eBay market data — real sold comps, not estimates — refreshed automatically. Every price on your dashboard is traceable to actual sales.',
  },
  {
    q: 'Which sports are supported?',
    a: 'All major sports and brands — football, basketball, baseball and more, across Panini, Topps, Bowman, and the rest of the big sets.',
  },
  {
    q: 'Where does the market intelligence come from?',
    a: 'Claude AI analyzes your portfolio against player performance, card scarcity, and market trends, then issues BUY / SELL / HOLD signals with a confidence score and price target per card.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. The Free tier is free forever with no credit card required, and Pro ($9/mo) can be cancelled anytime — you keep your portfolio data either way.',
  },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8 border-t border-[#1E2D45]">
      <div className="max-w-3xl mx-auto">
        <div data-reveal className="text-center mb-14">
          <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">FAQ</p>
          <h2 className="font-card text-4xl sm:text-5xl uppercase tracking-widest">
            <span className="title-chrome">Questions, answered</span>
          </h2>
        </div>

        <div data-reveal className="space-y-3">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div key={q} className={`chrome-panel overflow-hidden transition-colors duration-200 ${isOpen ? 'border-[rgba(245,200,66,0.25)]' : ''}`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className="font-display font-bold text-white text-sm sm:text-base">{q}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-gold-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-slate-400 text-sm font-sans leading-relaxed">{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
