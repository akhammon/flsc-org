import { parseCookies } from './cookies.js';
import { verifyToken } from './tokens.js';

export const SESSION_COOKIE = 'flsc_preview_session';
export const OAUTH_COOKIE = 'flsc_oauth_state';

export async function getSession(request, env) {
  const token = parseCookies(request.headers.get('cookie') || '')[SESSION_COOKIE];
  const payload = await verifyToken(token, env.SESSION_SECRET);
  if (!payload?.sub || !payload?.email) return null;
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || '',
  };
}

export function publicOrigin(request, env) {
  const configured = (env.PUBLIC_ORIGIN || '').replace(/\/$/, '');
  return configured || new URL(request.url).origin;
}
