const signedOut = document.querySelector('#signed-out');
const signedIn = document.querySelector('#signed-in');
const identityStatus = document.querySelector('#identity-status');
const sandboxProducts = document.querySelector('#sandbox-products');
const sandboxStatus = document.querySelector('#sandbox-status');

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

function status(element, message, tone = '') {
  element.textContent = message;
  element.className = `${element === sandboxStatus ? 'sandbox-status' : 'account-status'} ${tone}`.trim();
}

function renderIdentity(user) {
  signedOut.hidden = Boolean(user);
  signedIn.hidden = !user;
  if (!user) {
    status(identityStatus, 'Not signed in to the preview.');
    return;
  }
  document.querySelector('#account-name').textContent = user.name;
  document.querySelector('#account-email').textContent = user.email;
  const picture = document.querySelector('#account-picture');
  if (user.picture) {
    picture.src = user.picture;
    picture.alt = `${user.name} profile picture`;
    picture.hidden = false;
  }
  status(identityStatus, 'Google identity verified for this preview session.', 'success');
}

function renderCatalog(configuration) {
  sandboxProducts.replaceChildren();
  for (const [itemId, item] of Object.entries(configuration.catalog || {})) {
    const card = document.createElement('article');
    card.className = 'sandbox-product';
    const title = document.createElement('h3');
    title.textContent = item.label;
    const price = document.createElement('strong');
    price.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.value);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Test in PayPal Sandbox';
    button.disabled = !configuration.ready;
    button.addEventListener('click', async () => {
      button.disabled = true;
      status(sandboxStatus, `Creating Sandbox order for ${item.label}…`);
      try {
        const order = await requestJson('/api/paypal/orders', {
          method: 'POST',
          body: JSON.stringify({ itemId }),
        });
        sessionStorage.setItem(`flsc-paypal-${order.orderId}`, order.checkoutToken);
        window.location.assign(order.approvalUrl);
      } catch {
        button.disabled = false;
        status(sandboxStatus, 'Sandbox order could not be created. Check the dedicated FLSC Sandbox configuration.', 'error');
      }
    });
    card.append(title, price, button);
    sandboxProducts.append(card);
  }
  if (!configuration.signedIn) {
    status(sandboxStatus, 'Sign in with Google to enable Sandbox checkout.');
  } else if (!configuration.ready) {
    status(sandboxStatus, 'Signed in. Dedicated FLSC PayPal Sandbox credentials still need to be configured.', 'error');
  } else {
    status(sandboxStatus, 'Ready for test orders. No live PayPal environment is enabled.', 'success');
  }
}

async function captureApprovedOrder() {
  const url = new URL(window.location.href);
  if (url.searchParams.get('paypal') !== 'approved' || !url.searchParams.get('token')) return;
  const orderId = url.searchParams.get('token');
  const checkoutToken = sessionStorage.getItem(`flsc-paypal-${orderId}`);
  if (!checkoutToken) {
    status(sandboxStatus, 'Sandbox approval returned without a matching checkout session. Start a new test order.', 'error');
    return;
  }
  status(sandboxStatus, 'Capturing approved Sandbox order…');
  try {
    const result = await requestJson('/api/paypal/capture', {
      method: 'POST',
      body: JSON.stringify({ orderId, checkoutToken }),
    });
    const amount = result.amount ? `${result.amount.currency_code} ${result.amount.value}` : 'test amount';
    status(sandboxStatus, `Sandbox capture complete: ${amount}. No real money moved.`, 'success');
  } catch {
    status(sandboxStatus, 'Sandbox approval returned, but capture could not be completed.', 'error');
  } finally {
    sessionStorage.removeItem(`flsc-paypal-${orderId}`);
    url.searchParams.delete('paypal');
    url.searchParams.delete('token');
    url.searchParams.delete('PayerID');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
}

document.querySelector('#logout-button').addEventListener('click', async () => {
  await requestJson('/api/auth/logout', { method: 'POST', body: '{}' });
  window.location.reload();
});

try {
  const [{ user }, configuration] = await Promise.all([
    requestJson('/api/auth/session'),
    requestJson('/api/paypal/config'),
  ]);
  renderIdentity(user);
  renderCatalog(configuration);
  await captureApprovedOrder();
} catch {
  renderIdentity(null);
  status(identityStatus, 'Preview services are not configured yet.', 'error');
  status(sandboxStatus, 'Sandbox services are unavailable until the dedicated environment variables are added.', 'error');
}
