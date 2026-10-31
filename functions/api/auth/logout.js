import { SESSION_COOKIE } from '../../_lib/auth.js';
import { cookie } from '../../_lib/cookies.js';
import { json, methodNotAllowed } from '../../_lib/responses.js';

function handlePost() {
  return json(
    { ok: true },
    { headers: { 'set-cookie': cookie(SESSION_COOKIE, '', { maxAge: 0, sameSite: 'Lax' }) } },
  );
}

export function onRequest(context) {
  if (context.request.method !== 'POST') return methodNotAllowed('POST');
  return handlePost(context);
}
