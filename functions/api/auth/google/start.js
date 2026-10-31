import { cookie } from '../../../_lib/cookies.js';
import { OAUTH_COOKIE, publicOrigin } from '../../../_lib/auth.js';
import { redirect, json } from '../../../_lib/responses.js';
import { pkceChallenge, randomToken, safeReturnTo, signToken } from '../../../_lib/tokens.js';

export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET) {
    return json({ error: 'google_oauth_not_configured' }, { status: 503 });
  }
  const requestUrl = new URL(request.url);
  const returnTo = safeReturnTo(requestUrl.searchParams.get('returnTo'));
  const state = randomToken();
  const verifier = randomToken(48);
  const expires = Math.floor(Date.now() / 1000) + 10 * 60;
  const oauthCookie = await signToken({ state, verifier, returnTo, exp: expires }, env.SESSION_SECRET);
  const callbackUrl = `${publicOrigin(request, env)}/api/auth/google/callback`;
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return redirect(authorizationUrl.toString(), {
    'set-cookie': cookie(OAUTH_COOKIE, oauthCookie, { maxAge: 600, path: '/api/auth/google' }),
  });
}
