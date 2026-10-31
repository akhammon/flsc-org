# Finger Lakes Soaring Club — modern public site

A responsive, accessible replacement for the public FLSC website. The source site at `flsc.org` is treated as read-only. This project preserves the club's public content and routes authenticated member operations back to the current production member system until a controlled migration is approved.

## Production

- Host: Cloudflare Pages
- Project: `flsc-org`
- Production branch: `main`
- Build command: none
- Output directory: `dist`
- Custom domain: `https://flsc.keenehammond.com`

Every push to `main` triggers a Cloudflare Pages deployment.

## Preview identity and payments

The modern site has an intentionally separate preview account at
`/account.html`:

- Google OAuth authenticates a preview identity only. It does not establish
  FLSC membership, qualification, duty status, scheduling authority, or
  permission to operate.
- The official member system at `flsc.org` remains authoritative and is linked
  beside the preview account throughout the experience.
- PayPal is hard-locked to the Sandbox API in server code. A production PayPal
  environment is rejected even if production credentials are supplied.
- PayPal credentials, the Google client secret, and the session-signing secret
  remain in Cloudflare environment variables; none are shipped to the browser.

Create dedicated FLSC Google OAuth and PayPal Sandbox applications. Do not
reuse BDSF or RAF credentials, webhooks, users, entitlements, or payment
records.

Cloudflare Pages Functions require these environment variables:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_ORIGIN` | `https://flsc.keenehammond.com` in the preview deployment |
| `SESSION_SECRET` | Random secret of at least 32 characters |
| `GOOGLE_CLIENT_ID` | Dedicated FLSC web OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Dedicated FLSC web OAuth client secret |
| `PAYPAL_ENV` | Must be exactly `sandbox` |
| `PAYPAL_CLIENT_ID` | Dedicated FLSC PayPal Sandbox REST app client ID |
| `PAYPAL_CLIENT_SECRET` | Dedicated FLSC PayPal Sandbox REST app secret |

Configure the Google OAuth client with this exact callback:

`https://flsc.keenehammond.com/api/auth/google/callback`

The PayPal flow creates and captures orders from a server-owned catalog. It
does not accept browser-supplied prices. A future production launch also needs
club approval, a persistent transaction ledger, verified webhooks, refund and
reconciliation procedures, and updated privacy/terms—not merely live keys.

## Local preview

Copy `.dev.vars.example` to `.dev.vars`, add local-only credentials, and use
Cloudflare Pages development tooling to exercise Functions. Never commit
`.dev.vars`.

Run the dependency-free verification suite with:

```text
npm test
npm run check
```

## Content provenance

Public copy, pricing, contact details, branding, and photography were inventoried from `https://flsc.org/` on October 26, 2026. The private crawl output is deliberately excluded from Git.

