# CardIQ

Sports card portfolio intelligence. Photograph a card, get it identified, priced
against live eBay comps, and tracked in a portfolio that tells you when
something changes.

Built with Next.js 16 and Claude (Anthropic SDK) for card identification.

## What it does

- **Scan** — photograph a card; Claude identifies player, set, year, parallel,
  and grade, then matches it against eBay sold comps for a market value.
- **Portfolio** — track holdings with cost basis, current value, and a value
  history chart. Bulk CSV import supported.
- **Intelligence** — a nightly sweep scores each holding on price momentum,
  PSA population changes, player performance, and news, then emails you when a
  signal flips. Signal calls are graded after the fact by an outcome check, so
  the scoring is accountable rather than decorative.
- **Alerts** — price-movement emails with a dismissal flow.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Database | Neon (serverless Postgres) |
| Billing | Stripe (subscription + webhook) |
| AI | Anthropic Claude — card identification and signal narratives |
| Pricing data | eBay Finding + Browse APIs (sold and active listings) |
| Stats / news | BallDontLie, ESPN fallback, NewsData.io |
| Email | Resend |
| Storage | Vercel Blob |
| Scheduling | GitHub Actions cron (price refresh, signal sweep, outcome check) |

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Open http://localhost:3000.

Every external integration is optional except the database and auth — the app
degrades gracefully when a key is absent (stats fall back to ESPN's public API,
news enrichment switches off, and so on).

## Project layout

```
app/(app)/       dashboard, portfolio, scan, intelligence, settings
app/api/         route handlers — identify-card, ebay-*, signals, stripe, ...
lib/             db, quant scoring, signal sweep, rate limiting, gates, email
design-system/   shared tokens and primitives
.github/workflows/  scheduled price refresh, signal sweep, outcome check
```

## Scheduled jobs

Three GitHub Actions workflows hit protected endpoints on a cron. They
authenticate with `PRICE_REFRESH_SECRET`, so set that secret in both the app
environment and the repository's Actions secrets.

## License

ISC.
