import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initSchema, dbAddToWaitlist, dbMarkWelcomed } from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple rate limit: 1 submission per IP per 60s (in-memory, resets on cold start)
const recentIPs = new Map<string, number>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const last = recentIPs.get(ip);
  if (last && now - last < 60_000) return false;
  recentIPs.set(ip, now);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
    }

    const { email } = await req.json() as { email?: string };
    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }

    await initSchema();
    const { isNew, position } = await dbAddToWaitlist(email);

    // Only send welcome email once per address
    if (isNew && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'CardIQ <onboarding@resend.dev>',
          to: email,
          subject: "You're on the CardIQ waitlist 🏆",
          html: buildWelcomeEmail(email, position),
        });
        await dbMarkWelcomed(email);
      } catch (emailErr) {
        // Non-fatal — log but don't fail the signup
        console.error('[waitlist] email send failed:', emailErr);
      }
    }

    return NextResponse.json({ ok: true, position, alreadyJoined: !isNew });
  } catch (err) {
    console.error('[waitlist] POST error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

function buildWelcomeEmail(email: string, position: number): string {
  const posLabel = position <= 100
    ? `You're <strong>#${position}</strong> on the list — in the first 100 members.`
    : `You're <strong>#${position}</strong> on the list.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to CardIQ</title>
</head>
<body style="margin:0;padding:0;background:#060E1C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060E1C;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;" align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#C0C8D8,#F5C842,#00D4AA);border-radius:4px;padding:8px 12px;">
                    <span style="font-size:18px;font-weight:900;color:#060E1C;letter-spacing:0.12em;font-family:Georgia,serif;">CARDIQ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(145deg,#131E34,#0D1727,#131E34);border:1px solid rgba(245,200,66,0.25);border-radius:12px;overflow:hidden;">

              <!-- Gold top line -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:2px;background:linear-gradient(90deg,transparent,#F5C842,#FAE07A,#F5C842,transparent);"></td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <!-- Badge -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:rgba(245,200,66,0.1);border:1px solid rgba(245,200,66,0.3);border-radius:20px;padding:6px 14px;">
                          <span style="color:#F5C842;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Early Access</span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:0.03em;line-height:1.2;">
                      You&rsquo;re in. 🏆
                    </h1>

                    <p style="margin:0 0 24px;font-size:16px;color:#94a3b8;line-height:1.6;">
                      ${posLabel} When we open the doors, you&rsquo;ll be first to get access to everything CardIQ has built.
                    </p>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr><td style="height:1px;background:rgba(30,45,69,0.8);"></td></tr>
                    </table>

                    <!-- Features -->
                    <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#8892A4;letter-spacing:0.1em;text-transform:uppercase;">
                      What&rsquo;s coming your way
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${[
                        ['🔍', 'AI Card Scanner', 'Photograph any card — Claude Vision identifies it in seconds'],
                        ['📈', 'Live Portfolio Tracker', 'Real eBay pricing, ROI, and P&L updated automatically'],
                        ['🧠', 'Market Intelligence', 'Wyckoff signals, EV framing, and BUY/SELL/HOLD with price targets'],
                      ].map(([icon, title, desc]) => `
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(30,45,69,0.5);">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;font-size:18px;vertical-align:top;padding-top:2px;">${icon}</td>
                              <td style="padding-left:8px;">
                                <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#e2e8f0;">${title}</p>
                                <p style="margin:0;font-size:12px;color:#8892A4;line-height:1.5;">${desc}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join('')}
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 20px;">
                      <tr><td style="height:1px;background:rgba(30,45,69,0.8);"></td></tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                      We&rsquo;ll only email you when access opens. No spam, ever.<br/>
                      <span style="color:#8892A4;">&mdash; The CardIQ team</span>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;" align="center">
              <p style="margin:0;font-size:11px;color:#334155;letter-spacing:0.06em;text-transform:uppercase;">
                &copy; ${new Date().getFullYear()} CardIQ &middot; You&rsquo;re receiving this because you joined the waitlist at cardiq-rho.vercel.app
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
