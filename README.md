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

## Local preview

Serve `dist/` with any static web server.

## Content provenance

Public copy, pricing, contact details, branding, and photography were inventoried from `https://flsc.org/` on October 26, 2026. The private crawl output is deliberately excluded from Git.

