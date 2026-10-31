import { getSession, publicOrigin } from '../../_lib/auth.js';
import { PAYPAL_CATALOG, paypalRequest, sandboxApprovalUrl } from '../../_lib/paypal.js';
import { json, methodNotAllowed } from '../../_lib/responses.js';
import { randomToken, signToken } from '../../_lib/tokens.js';

async function handlePost({ request, env }) {
  const user = await getSession(request, env);
  if (!user) return json({ error: 'sign_in_required' }, { status: 401 });
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: 'same_origin_required' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const item = PAYPAL_CATALOG[body.itemId];
  if (!item) return json({ error: 'invalid_catalog_item' }, { status: 400 });
  try {
    const origin = publicOrigin(request, env);
    const intentId = `flsc:${randomToken(18)}:${body.itemId}`;
    const order = await paypalRequest(env, '/v2/checkout/orders', {
      method: 'POST',
      headers: { 'paypal-request-id': `flsc-create-${crypto.randomUUID()}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: intentId,
            description: `${item.label} · FLSC Sandbox`,
            amount: { currency_code: item.currency, value: item.value },
          },
        ],
        application_context: {
          brand_name: 'FLSC Sandbox',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: `${origin}/account.html?paypal=approved`,
          cancel_url: `${origin}/account.html?paypal=cancelled`,
        },
      }),
    });
    const approvalUrl = sandboxApprovalUrl(order);
    if (!order.id || !/^[A-Z0-9-]{8,64}$/i.test(order.id) || !approvalUrl) {
      throw new Error('PayPal approval link missing.');
    }
    const checkoutToken = await signToken(
      {
        type: 'paypal-checkout',
        sub: user.sub,
        orderId: order.id,
        itemId: body.itemId,
        intentId,
        currency: item.currency,
        value: item.value,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      env.SESSION_SECRET,
    );
    return json({ orderId: order.id, approvalUrl, checkoutToken, mode: 'sandbox' });
  } catch (error) {
    console.error('FLSC PayPal Sandbox order creation failed.', error);
    return json({ error: 'sandbox_order_failed' }, { status: 502 });
  }
}

export function onRequest(context) {
  if (context.request.method !== 'POST') return methodNotAllowed('POST');
  return handlePost(context);
}
