import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

const root = 'https://flsc.org/';
const out = new URL('../audit/', import.meta.url).pathname.replace(/^\/(.:)/, '$1');
const queue = [new URL(root)];
const seen = new Set();
const records = [];
const assets = new Set();
const maxPages = 160;

function clean(u) {
  const url = new URL(u, root);
  url.protocol = 'https:';
  url.hash = '';
  if (url.hostname === 'www.flsc.org') url.hostname = 'flsc.org';
  return url;
}

function isPage(url) {
  if (url.hostname !== 'flsc.org') return false;
  const ext = extname(url.pathname).toLowerCase();
  return !ext || ['.php', '.html', '.htm'].includes(ext);
}

function safeName(url, contentType) {
  let p = decodeURIComponent(url.pathname).replace(/^\/+/, '').replace(/[<>:"|?*]/g, '_');
  if (!p || p.endsWith('/')) p += 'index.html';
  if (!extname(p) && contentType.includes('text/html')) p += '.html';
  if (url.search) p += '__' + url.search.slice(1).replace(/[^a-z0-9.-]+/gi, '_').slice(0, 100);
  return p;
}

while (queue.length && records.length < maxPages) {
  const url = clean(queue.shift());
  const key = url.href;
  if (seen.has(key) || !isPage(url)) continue;
  seen.add(key);
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'FLSC replacement audit/1.0' } });
    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();
    const links = [...body.matchAll(/(?:href|src)\s*=\s*["']([^"'#]+)["']/gi)].map(m => m[1]);
    for (const raw of links) {
      if (/^(mailto:|tel:|javascript:|data:)/i.test(raw)) continue;
      let next;
      try { next = clean(new URL(raw.replace(/&amp;/g, '&'), response.url)); } catch { continue; }
      if (next.hostname === 'flsc.org' && isPage(next)) queue.push(next);
      else if (next.hostname === 'flsc.org') assets.add(next.href);
    }
    const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, ' ').trim() || '';
    records.push({ url: key, finalUrl: response.url, status: response.status, contentType, title, bytes: Buffer.byteLength(body), links: links.length });
    const file = join(out, 'pages', safeName(url, contentType));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
    process.stdout.write(`${response.status} ${key}\n`);
  } catch (error) {
    records.push({ url: key, error: String(error) });
  }
}

const assetRecords = [];
let assetIndex = 0;
for (const href of assets) {
  const url = new URL(href);
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'FLSC replacement audit/1.0' } });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    assetRecords.push({ url: href, status: response.status, contentType, bytes: bytes.length });
    if (response.ok && bytes.length < 25_000_000) {
      const file = join(out, 'assets', safeName(url, contentType));
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, bytes);
    }
  } catch (error) {
    assetRecords.push({ url: href, error: String(error) });
  }
  assetIndex++;
  if (assetIndex % 25 === 0) console.log(`Assets ${assetIndex}/${assets.size}`);
}

await mkdir(out, { recursive: true });
await writeFile(join(out, 'inventory.json'), JSON.stringify({ crawledAt: new Date().toISOString(), root, pages: records, assets: assetRecords }, null, 2));
console.log(`Crawled ${records.length} pages and ${assetRecords.length} assets.`);
