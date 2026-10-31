import { getSession } from '../../_lib/auth.js';
import { PAYPAL_CATALOG, paypalOrderMatches, paypalRequest } from '../../_lib/paypal.js';
import { json, methodNotAllowed } from '../../_lib/responses.js';
import { verifyToken } from '../../_lib/tokens.js';

async function handlePost({ request, env }) {
  const user = await getSession(request, env);
  if (!user) return json({ error: 'sign_in_required' }, { status: 401 });
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: 'same_origin_required' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  if (!/^[A-Z0-9-]{8,64}$/i.test(body.orderId || '')) {
    return json({ error: 'invalid_order_id' }, { status: 400 });
  }
  const intent = await verifyToken(body.checkoutToken, env.SESSION_SECRET);
  const item = PAYPAL_CATALOG[intent?.itemId];
  if (
    !intent ||
    intent.type !== 'paypal-checkout' ||
    intent.sub !== user.sub ||
    intent.orderId !== body.orderId ||
    !item ||
    intent.currency !== item.currency ||
    intent.value !== item.value
  ) {
    return json({ error: 'checkout_intent_invalid' }, { status: 403 });
  }
  const expected = {
    orderId: intent.orderId,
    intentId: intent.intentId,
    currency: item.currency,
    value: item.value,
  };
  try {
    const approved = await paypalRequest(env, `/v2/checkout/orders/${body.orderId}`);
    if (!paypalOrderMatches(approved, expected, 'APPROVED')) {
      return json({ error: 'sandbox_order_mismatch' }, { status: 409 });
    }
    const capture = await paypalRequest(env, `/v2/checkout/orders/${body.orderId}/capture`, {
      method: 'POST',
      headers: { 'paypal-request-id': `flsc-capture-${body.orderId}` },
      body: '{}',
    });
    if (!paypalOrderMatches(capture, expected, 'COMPLETED')) {
      return json({ error: 'sandbox_capture_mismatch' }, { status: 409 });
    }
    const payment = capture.purchase_units?.[0]?.payments?.captures?.[0];
    if (!payment?.id || payment.status !== 'COMPLETED') {
      return json({ error: 'sandbox_capture_incomplete' }, { status: 409 });
    }
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
