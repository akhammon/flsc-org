import { getSession } from '../../_lib/auth.js';
import { PAYPAL_CATALOG } from '../../_lib/paypal.js';
import { json } from '../../_lib/responses.js';

export async function onRequestGet({ request, env }) {
  const user = await getSession(request, env);
  const sandbox = (env.PAYPAL_ENV || '').toLowerCase() === 'sandbox';
  return json({
    mode: 'sandbox',
    ready: Boolean(user && sandbox && env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET),
    signedIn: Boolean(user),
    catalog: PAYPAL_CATALOG,
  });
}
