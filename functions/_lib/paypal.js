export const PAYPAL_CATALOG = Object.freeze({
  'ride-classic': { label: 'Classic glider ride', value: '110.00', currency: 'USD' },
  'ride-explorer': { label: 'Explorer glider ride', value: '145.00', currency: 'USD' },
  'ride-mile-high': { label: 'Mile High glider ride', value: '200.00', currency: 'USD' },
  'intro-instruction': { label: 'Introductory three-flight instruction', value: '250.00', currency: 'USD' },
  'club-support-25': { label: 'Club support test', value: '25.00', currency: 'USD' },
});

export function paypalConfiguration(env) {
  if ((env.PAYPAL_ENV || '').toLowerCase() !== 'sandbox') {
    throw new Error('PayPal is disabled unless PAYPAL_ENV is exactly sandbox.');
  }
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal Sandbox credentials are not configured.');
  }
  return { baseUrl: 'https://api-m.sandbox.paypal.com' };
}

async function accessToken(env) {
  const { baseUrl } = paypalConfiguration(env);
  const basic = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${basic}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new Error(`PayPal token request failed (${response.status}).`);
  const data = await response.json();
  if (!data.access_token) throw new Error('PayPal did not return an access token.');
  return { baseUrl, token: data.access_token };
}

export async function paypalRequest(env, path, init = {}) {
  const { baseUrl, token } = await accessToken(env);
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${token}`);
  headers.set('content-type', 'application/json');
  headers.set('accept', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || `PayPal request failed (${response.status}).`;
    throw new Error(message);
  }
  return data;
}
