import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [account, accountScript, shell, headers, paypal, readme] = await Promise.all([
  read('dist/account.html'),
  read('dist/account.js'),
  read('dist/shell.js'),
  read('dist/_headers'),
  read('functions/_lib/paypal.js'),
  read('README.md'),
]);

assert.match(account, /Preview identity is not club authority/);
assert.match(account, /Official member system/);
assert.match(account, /PayPal developer environment/);
assert.match(accountScript, /\/api\/auth\/session/);
assert.match(accountScript, /\/api\/paypal\/orders/);
assert.match(shell, /Preview account/);
assert.match(headers, /Content-Security-Policy/);
assert.match(headers, /Strict-Transport-Security/);
assert.match(paypal, /api-m\.sandbox\.paypal\.com/);
assert.doesNotMatch(paypal, /api-m\.paypal\.com/);
assert.match(readme, /Do not\s+reuse BDSF or RAF credentials/);

console.log('FLSC site, identity boundary, and Sandbox payment checks passed.');
