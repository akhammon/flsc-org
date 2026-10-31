import { OAUTH_COOKIE, SESSION_COOKIE, publicOrigin } from '../../../_lib/auth.js';
import { cookie, parseCookies } from '../../../_lib/cookies.js';
import { redirect } from '../../../_lib/responses.js';
import { safeReturnTo, signToken, verifyToken } from '../../../_lib/tokens.js';

function finish(request, env, returnTo, status, extraHeaders = {}) {
  const target = new URL(safeReturnTo(returnTo), publicOrigin(request, env));
  target.searchParams.set('auth', status);
  const headers = new Headers(extraHeaders);
  headers.append('set-cookie', cookie(OAUTH_COOKIE, '', { maxAge: 0, path: '/api/auth/google' }));
  return redirect(target.toString(), headers);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const cookies = parseCookies(request.headers.get('cookie') || '');
  const oauthState = await verifyToken(cookies[OAUTH_COOKIE], env.SESSION_SECRET);
  if (!oauthState || url.searchParams.get('state') !== oauthState.state || !url.searchParams.get('code')) {
    return finish(request, env, '/account.html', 'error');
  }

  try {
    const callbackUrl = `${publicOrigin(request, env)}/api/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code: url.searchParams.get('code'),
        code_verifier: oauthState.verifier,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    });
    if (!tokenResponse.ok) throw new Error('Google token exchange failed.');
    const tokens = await tokenResponse.json();
    if (!tokens.id_token) throw new Error('Google ID token missing.');

    const identityResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`,
    );
    if (!identityResponse.ok) throw new Error('Google identity verification failed.');
    const identity = await identityResponse.json();
    const validIssuer = identity.iss === 'https://accounts.google.com' || identity.iss === 'accounts.google.com';
    if (
      identity.aud !== env.GOOGLE_CLIENT_ID ||
      !validIssuer ||
      identity.nonce !== oauthState.nonce ||
      identity.email_verified !== 'true' ||
      Number(identity.exp) * 1000 <= Date.now()
    ) {
      throw new Error('Google identity claims were rejected.');
    }

    const expires = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
    const session = await signToken(
      {
        sub: identity.sub,
        email: identity.email,
        name: identity.name || identity.email,
        picture: identity.picture || '',
        exp: expires,
      },
      env.SESSION_SECRET,
    );
    return finish(request, env, oauthState.returnTo, 'success', {
      'set-cookie': cookie(SESSION_COOKIE, session, { maxAge: 8 * 60 * 60, sameSite: 'Lax' }),
    });
  } catch (error) {
    console.error('FLSC Google OAuth callback failed.', error);
    return finish(request, env, oauthState.returnTo, 'error');
  }
}
