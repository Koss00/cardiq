let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getEbayAppToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    console.log('[ebay-auth] using cached token');
    return tokenCache.token;
  }

  const appId  = process.env.EBAY_APP_ID?.trim();
  const certId = process.env.EBAY_CERT_ID?.trim();

  if (!appId || !certId) {
    throw new Error('EBAY_APP_ID and EBAY_CERT_ID must both be set in .env.local');
  }

  const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');

  console.log('[ebay-auth] requesting new application token');

  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    next: { revalidate: 0 },
  });

  const rawBody = await res.text();
  console.log('[ebay-auth] token response status:', res.status);

  if (!res.ok) {
    throw new Error(`eBay token request failed HTTP ${res.status}: ${rawBody.slice(0, 300)}`);
  }

  const data = JSON.parse(rawBody) as { access_token: string; expires_in: number };
  const expiresIn = data.expires_in ?? 7200;

  tokenCache = {
    token:     data.access_token,
    expiresAt: Date.now() + (expiresIn - 300) * 1000, // 5-min buffer
  };

  console.log(`[ebay-auth] token cached, expires in ${expiresIn}s`);
  return tokenCache.token;
}
