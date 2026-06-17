import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? 'CardIQ <alerts@cardiq-rho.vercel.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cardiq-rho.vercel.app';

interface PriceAlertParams {
  to: string;
  player: string;
  alertType: 'SPIKE' | 'DROP';
  oldPrice: number;
  newPrice: number;
  pctChange: number;
}

export async function sendPriceAlertEmail(params: PriceAlertParams): Promise<void> {
  if (!resend) return; // silently skip if Resend not configured

  const { to, player, alertType, oldPrice, newPrice, pctChange } = params;
  const isSpike = alertType === 'SPIKE';
  const arrow   = isSpike ? '📈' : '📉';
  const verb    = isSpike ? 'jumped' : 'dropped';
  const sign    = isSpike ? '+' : '-';
  const color   = isSpike ? '#10b981' : '#ef4444';

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${arrow} ${player} card ${verb} ${sign}${Math.abs(pctChange).toFixed(1)}%`,
    html: `
<!DOCTYPE html>
<html>
<body style="background:#060E1C;color:#e8edf5;font-family:system-ui,sans-serif;margin:0;padding:32px;">
  <div style="max-width:480px;margin:0 auto;">
    <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8892A4;margin-bottom:24px;">CardIQ Price Alert</p>
    <h1 style="font-size:22px;font-weight:900;margin:0 0 8px;">${arrow} ${player}</h1>
    <p style="font-size:15px;color:#8892A4;margin:0 0 28px;">
      Market price ${verb} <span style="color:${color};font-weight:700;">${sign}${Math.abs(pctChange).toFixed(1)}%</span>
    </p>
    <div style="background:#111D33;border:1px solid #1E2D45;border-radius:8px;padding:20px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="color:#8892A4;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Previous</span>
        <span style="font-weight:700;">$${oldPrice.toFixed(2)}</span>
      </div>
      <div style="height:1px;background:#1E2D45;margin-bottom:12px;"></div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:#8892A4;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Current</span>
        <span style="font-weight:900;color:${color};font-size:18px;">$${newPrice.toFixed(2)}</span>
      </div>
    </div>
    <a href="${APP_URL}/intelligence"
       style="display:inline-block;background:#F5C842;color:#060E1C;font-weight:900;font-size:12px;
              letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;
              padding:12px 24px;border-radius:4px;">
      View Intelligence →
    </a>
    <p style="font-size:10px;color:#8892A4;margin-top:32px;">
      CardIQ · For informational purposes only. Not financial advice.
    </p>
  </div>
</body>
</html>`,
  }).catch(() => {}); // non-blocking — never fail the cron
}

// One flipped card in a signal-change digest.
export interface SignalDriftItem {
  player: string;
  card: string;
  oldSignal: 'BUY' | 'SELL' | 'HOLD';
  newSignal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  summary: string;
}

const SIGNAL_COLOR: Record<string, string> = { BUY: '#10b981', SELL: '#ef4444', HOLD: '#8892A4' };

/**
 * Proactive "your card's signal changed" digest — one email per user listing every
 * card whose BUY/HOLD/SELL verdict flipped in the nightly sweep. Non-blocking.
 */
export async function sendSignalDigestEmail(to: string, drifts: SignalDriftItem[]): Promise<void> {
  if (!resend || drifts.length === 0) return;

  const rows = drifts.map((d) => `
    <div style="background:#111D33;border:1px solid #1E2D45;border-radius:8px;padding:16px 20px;margin-bottom:12px;">
      <div style="font-weight:800;font-size:15px;margin-bottom:2px;">${d.player}</div>
      <div style="color:#8892A4;font-size:12px;margin-bottom:10px;">${d.card}</div>
      <div style="font-size:14px;margin-bottom:8px;">
        <span style="color:${SIGNAL_COLOR[d.oldSignal]};font-weight:700;">${d.oldSignal}</span>
        <span style="color:#8892A4;">&nbsp;→&nbsp;</span>
        <span style="color:${SIGNAL_COLOR[d.newSignal]};font-weight:900;">${d.newSignal}</span>
        <span style="color:#8892A4;font-size:12px;">&nbsp;·&nbsp;${d.confidence}% confidence</span>
      </div>
      <div style="color:#c3ccda;font-size:13px;line-height:1.5;">${d.summary}</div>
    </div>`).join('');

  const subject = drifts.length === 1
    ? `⚠️ ${drifts[0].player}: ${drifts[0].oldSignal} → ${drifts[0].newSignal} · CardIQ`
    : `⚠️ ${drifts.length} portfolio signals changed · CardIQ`;

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<body style="background:#060E1C;color:#e8edf5;font-family:system-ui,sans-serif;margin:0;padding:32px;">
  <div style="max-width:480px;margin:0 auto;">
    <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8892A4;margin-bottom:24px;">CardIQ Signal Alert</p>
    <h1 style="font-size:22px;font-weight:900;margin:0 0 8px;">${drifts.length === 1 ? 'A signal changed' : `${drifts.length} signals changed`}</h1>
    <p style="font-size:15px;color:#8892A4;margin:0 0 28px;">Overnight analysis flipped the verdict on ${drifts.length === 1 ? 'a card' : 'cards'} in your portfolio.</p>
    ${rows}
    <a href="${APP_URL}/intelligence"
       style="display:inline-block;background:#F5C842;color:#060E1C;font-weight:900;font-size:12px;
              letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;
              padding:12px 24px;border-radius:4px;margin-top:16px;">
      View Intelligence →
    </a>
    <p style="font-size:10px;color:#8892A4;margin-top:32px;">
      CardIQ · For informational purposes only. Not financial advice.
    </p>
  </div>
</body>
</html>`,
  }).catch(() => {}); // non-blocking — never fail the cron
}

interface UpgradeConfirmParams {
  to: string;
}

export async function sendUpgradeConfirmEmail(params: UpgradeConfirmParams): Promise<void> {
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: '🎉 Welcome to CardIQ Pro',
    html: `
<!DOCTYPE html>
<html>
<body style="background:#060E1C;color:#e8edf5;font-family:system-ui,sans-serif;margin:0;padding:32px;">
  <div style="max-width:480px;margin:0 auto;">
    <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8892A4;margin-bottom:24px;">CardIQ</p>
    <h1 style="font-size:22px;font-weight:900;margin:0 0 8px;">You're on Pro 🎉</h1>
    <p style="font-size:15px;color:#8892A4;margin:0 0 28px;">
      Unlimited cards, unlimited signal refreshes, and priority analysis.
    </p>
    <a href="${APP_URL}/portfolio"
       style="display:inline-block;background:#F5C842;color:#060E1C;font-weight:900;font-size:12px;
              letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;
              padding:12px 24px;border-radius:4px;">
      Go to Portfolio →
    </a>
  </div>
</body>
</html>`,
  }).catch(() => {});
}
