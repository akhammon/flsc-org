export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function redirect(location, headers = {}) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('location', location);
  responseHeaders.set('cache-control', 'private, no-store');
  return new Response(null, { status: 302, headers: responseHeaders });
}

export function methodNotAllowed(allowed) {
  return json({ error: 'method_not_allowed' }, { status: 405, headers: { allow: allowed } });
}
