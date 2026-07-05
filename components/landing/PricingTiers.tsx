import Link from 'next/link';
import { Check, ChevronRight } from 'lucide-react';

/**
 * PricingTiers — landing-page pricing pulled from the real /pricing plans.
 * CardIQ sells two live tiers (Free $0, Pro $9); the third column is an
 * honest "coming soon" — no fake purchasable tier.
 */

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'Perfect for getting started',
    features: [
      'Up to 5 cards in your portfolio',
      'AI card identification via photo',
      'Live eBay market pricing',
      '20 AI signal refreshes per day',
      'Price history charts',
    ],
    cta: { label: 'Get Started Free', href: '/sign-up' },
    featured: false,
    soon: false,
  },
  {
    name: 'Pro',
    price: '$9',
    tagline: 'For serious collectors',
    features: [
      'Unlimited cards & AI signals',
      'Price spike & drop alerts',
      'Market Narrative — portfolio synthesis',
      'Expected return projections',
      'Signal outcome tracking',
      'CSV export + email support',
    ],
    cta: { label: 'Upgrade to Pro', href: '/pricing' },
    featured: true,
    soon: false,
  },
  {
    name: 'Dealer',
    price: '—',
    tagline: 'For shops & breakers — coming soon',
    features: [
      'Bulk scanning & inventory sync',
      'Multi-portfolio management',
      'Wholesale comps & trend reports',
      'API access',
    ],
    cta: { label: 'Join the Waitlist', href: '#waitlist' },
    featured: false,
    soon: true,
  },
];

export default function PricingTiers() {
  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8 border-t border-[#1E2D45]">
      <div className="max-w-6xl mx-auto">
        <div data-reveal className="text-center mb-16">
          <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">Pricing</p>
          <h2 className="font-card text-4xl sm:text-5xl uppercase tracking-widest mb-4">
            <span className="title-gold">Start free. Upgrade when it pays for itself.</span>
          </h2>
          <p className="text-slate-400 text-base font-sans max-w-xl mx-auto">
            No credit card required to get started.
          </p>
        </div>

        <div data-reveal className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {TIERS.map(({ name, price, tagline, features, cta, featured, soon }) => (
            <div
              key={name}
              className={`relative chrome-panel p-8 flex flex-col overflow-hidden ${
                featured ? 'border border-[rgba(245,200,66,0.35)] md:-my-3 md:py-11' : ''
              } ${soon ? 'opacity-70' : ''}`}
              style={
                featured
                  ? { boxShadow: '0 0 0 1px rgba(245,200,66,0.15), 0 24px 80px rgba(4,11,22,0.7), 0 0 60px rgba(245,200,66,0.08)' }
                  : undefined
              }
            >
              {featured && (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,200,66,0.1) 0%, transparent 65%)' }}
                  />
                  <div
                    className="absolute top-0 left-4 right-4 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, #F5C842, transparent)' }}
                  />
                  <span className="absolute top-4 right-4 bg-gold-400 text-[#060E1C] text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">
                    Most Popular
                  </span>
                </>
              )}
              {soon && (
                <span className="absolute top-4 right-4 border border-[rgba(192,200,216,0.25)] text-chrome-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">
                  Coming Soon
                </span>
              )}

              <div className="relative mb-6">
                <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-3">{name}</p>
                <div className="flex items-end gap-2">
                  <span className={`font-card text-5xl ${featured ? 'title-gold' : 'text-white'}`}>{price}</span>
                  {!soon && <span className="text-chrome-500 font-sans text-sm mb-1.5">/month</span>}
                </div>
                <p className="text-slate-500 text-sm font-sans mt-2">{tagline}</p>
              </div>

              <ul className="relative space-y-3 mb-8 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check size={13} className={`mt-0.5 flex-shrink-0 ${featured ? 'text-gold-400' : 'text-electric'}`} />
                    <span className="text-slate-400 text-sm font-sans">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={cta.href}
                className={`relative w-full flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest ${
                  featured
                    ? 'btn-gold'
                    : 'rounded-sm bg-[#111D33] border border-[rgba(192,200,216,0.18)] text-chrome-200 hover:border-[rgba(192,200,216,0.35)] hover:text-white transition-all duration-200'
                }`}
              >
                {cta.label} <ChevronRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
