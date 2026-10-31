import { getSession } from '../../_lib/auth.js';
import { paypalRequest } from '../../_lib/paypal.js';
import { json, methodNotAllowed } from '../../_lib/responses.js';

async function handlePost({ request, env }) {
  const user = await getSession(request, env);
  if (!user) return json({ error: 'sign_in_required' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!/^[A-Z0-9-]{8,64}$/i.test(body.orderId || '')) {
    return json({ error: 'invalid_order_id' }, { status: 400 });
  }
  try {
    const capture = await paypalRequest(env, `/v2/checkout/orders/${body.orderId}/capture`, {
      method: 'POST',
      headers: { 'paypal-request-id': crypto.randomUUID() },
      body: '{}',
    });
    const payment = capture.purchase_units?.[0]?.payments?.captures?.[0];
    return json({
      mode: 'sandbox',
      orderId: capture.id,
      status: capture.status,
      itemId: capture.purchase_units?.[0]?.custom_id || '',
      captureId: payment?.id || '',
      amount: payment?.amount || null,
    });
  } catch (error) {
    console.error('FLSC PayPal Sandbox capture failed.', error);
    return json({ error: 'sandbox_capture_failed' }, { status: 502 });
  }
}

export function onRequest(context) {
  if (context.request.method !== 'POST') return methodNotAllowed('POST');
  return handlePost(context);
}
