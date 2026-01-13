import { b64encode, b64decode, hmacSha256Hex, stableStringify } from './crypto.js';

export async function buildSamlLikeResponse({ app, user, request, overrides = {} }) {
  const now = Math.floor(Date.now() / 1000);
  const basePayload = {
    iss: 'mock-idp',
    aud: request.spEntityId,
    recipient: request.acs,
    inResponseTo: request.requestId,
    iat: now,
    exp: now + 300,
    subject: {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      groups: user.groups
    }
  };
  const payload = { ...basePayload, ...overrides };
  const unsigned = { ...payload };
  const message = stableStringify(unsigned);
  const sig = await hmacSha256Hex(message, app.sharedSecret);
  const signedPayload = { ...payload, sig };
  return {
    payloadObj: signedPayload,
    b64: b64encode(JSON.stringify(signedPayload))
  };
}

export async function verifySamlLikeResponse({ app, expected, b64 }) {
  const checks = [];
  if (!b64) {
    return {
      ok: false,
      payload: null,
      checks: [{ name: 'SAMLResponse present', ok: false, detail: 'SAMLResponseがありません' }]
    };
  }
  let payload;
  try {
    payload = JSON.parse(b64decode(b64));
    checks.push({ name: 'SAMLResponse decode', ok: true, detail: 'base64 decode OK' });
  } catch (error) {
    return {
      ok: false,
      payload: null,
      checks: [{ name: 'SAMLResponse decode', ok: false, detail: 'decode失敗' }]
    };
  }

  const now = Math.floor(Date.now() / 1000);
  checks.push({
    name: 'RelayState一致',
    ok: expected.relayState === expected.receivedRelayState,
    detail: `expected=${expected.relayState} received=${expected.receivedRelayState}`
  });
  checks.push({
    name: 'inResponseTo一致',
    ok: payload.inResponseTo === expected.requestId,
    detail: `expected=${expected.requestId} actual=${payload.inResponseTo}`
  });
  checks.push({
    name: 'aud一致',
    ok: payload.aud === app.spEntityId,
    detail: `expected=${app.spEntityId} actual=${payload.aud}`
  });
  checks.push({
    name: 'recipient一致',
    ok: payload.recipient === app.acsUrl,
    detail: `expected=${app.acsUrl} actual=${payload.recipient}`
  });
  checks.push({
    name: 'exp未期限切れ',
    ok: payload.exp > now,
    detail: `exp=${payload.exp} now=${now}`
  });

  const { sig, ...unsigned } = payload;
  const message = stableStringify(unsigned);
  const computed = await hmacSha256Hex(message, app.sharedSecret);
  checks.push({
    name: 'sig検証',
    ok: sig === computed,
    detail: `expected=${computed.slice(0, 10)}... actual=${sig ? sig.slice(0, 10) : ''}...`
  });

  const ok = checks.every((check) => check.ok);
  return { ok, checks, payload };
}
