import test from 'node:test';
import assert from 'node:assert/strict';
import { cookie, parseCookies } from '../functions/_lib/cookies.js';
import { PAYPAL_CATALOG, paypalConfiguration } from '../functions/_lib/paypal.js';
import { safeReturnTo, signToken, verifyToken } from '../functions/_lib/tokens.js';

const secret = 'test-secret-that-is-definitely-longer-than-thirty-two-characters';

test('signed preview sessions verify and reject tampering', async () => {
  const token = await signToken({ sub: 'google-1', email: 'pilot@example.com', exp: 2_000_000_000 }, secret);
  assert.equal((await verifyToken(token, secret, 1_900_000_000_000)).email, 'pilot@example.com');
  assert.equal(await verifyToken(`${token}x`, secret, 1_900_000_000_000), null);
});

test('expired sessions are rejected', async () => {
  const token = await signToken({ sub: 'google-1', email: 'pilot@example.com', exp: 100 }, secret);
  assert.equal(await verifyToken(token, secret, 101_000), null);
});

test('return targets remain on the FLSC origin', () => {
  assert.equal(safeReturnTo('/account.html?from=home'), '/account.html?from=home');
  assert.equal(safeReturnTo('https://evil.example/'), '/account.html');
  assert.equal(safeReturnTo('//evil.example/'), '/account.html');
  assert.equal(safeReturnTo('/account.html\r\nLocation: https://evil.example'), '/account.html');
});

test('cookies are parsed and security attributes are emitted', () => {
  assert.deepEqual(parseCookies('a=1; name=Keene%20Hammond'), { a: '1', name: 'Keene Hammond' });
  const value = cookie('session', 'signed-token', { maxAge: 60 });
  assert.match(value, /HttpOnly/);
  assert.match(value, /Secure/);
  assert.match(value, /SameSite=Lax/);
});

test('PayPal configuration can only use Sandbox', () => {
  assert.throws(
    () => paypalConfiguration({ PAYPAL_ENV: 'live', PAYPAL_CLIENT_ID: 'id', PAYPAL_CLIENT_SECRET: 'secret' }),
    /disabled/,
  );
  assert.deepEqual(
    paypalConfiguration({ PAYPAL_ENV: 'sandbox', PAYPAL_CLIENT_ID: 'id', PAYPAL_CLIENT_SECRET: 'secret' }),
    { baseUrl: 'https://api-m.sandbox.paypal.com' },
  );
});

test('Sandbox products use a fixed USD server catalog', () => {
  assert.equal(PAYPAL_CATALOG['ride-classic'].value, '110.00');
  assert.equal(PAYPAL_CATALOG['ride-classic'].currency, 'USD');
  assert.equal(Object.keys(PAYPAL_CATALOG).length, 5);
});
