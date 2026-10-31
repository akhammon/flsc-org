import { getSession } from '../../_lib/auth.js';
import { json, methodNotAllowed } from '../../_lib/responses.js';

async function handleGet({ request, env }) {
  return json({ user: await getSession(request, env) });
}

export function onRequest(context) {
  if (context.request.method !== 'GET') return methodNotAllowed('GET');
  return handleGet(context);
}
