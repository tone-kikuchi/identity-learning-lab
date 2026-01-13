export function randomId(prefix = 'id') {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}_${random[0].toString(16)}${random[1].toString(16)}`;
}

export function b64encode(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

export function b64decode(text) {
  return decodeURIComponent(escape(atob(text)));
}

export function stableStringify(obj) {
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => {
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return `"${key}":${stableStringify(value)}`;
    }
    return `"${key}":${JSON.stringify(value)}`;
  });
  return `{${entries.join(',')}}`;
}

export async function hmacSha256Hex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
