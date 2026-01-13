import '../setup-node.js';

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildSamlLikeResponse, verifySamlLikeResponse } from '../../shared/protocol_saml_like.js';

const app = {
  id: 'app_saml',
  mode: 'saml_like',
  spEntityId: 'sp.example.com',
  acsUrl: 'http://localhost:4173/sp/acs_receive.html',
  sharedSecret: 'shared-secret'
};

const user = {
  id: 'user_1',
  username: 'demo@example.com',
  displayName: 'Demo User',
  groups: ['admin']
};

const request = {
  appId: app.id,
  acs: app.acsUrl,
  spEntityId: app.spEntityId,
  requestId: 'req_123',
  relayState: 'relay_abc'
};

describe('SAML-like protocol', () => {
  it('builds and verifies a valid response', async () => {
    const { b64 } = await buildSamlLikeResponse({ app, user, request });
    const result = await verifySamlLikeResponse({
      app,
      expected: {
        requestId: request.requestId,
        relayState: request.relayState,
        receivedRelayState: request.relayState
      },
      b64
    });

    assert.equal(result.ok, true);
    assert.equal(result.payload?.subject?.username, user.username);
  });

  it('fails verification when audience does not match', async () => {
    const { b64 } = await buildSamlLikeResponse({
      app,
      user,
      request,
      overrides: { aud: 'sp.invalid' }
    });

    const result = await verifySamlLikeResponse({
      app,
      expected: {
        requestId: request.requestId,
        relayState: request.relayState,
        receivedRelayState: request.relayState
      },
      b64
    });

    assert.equal(result.ok, false);
    assert.equal(result.checks.some((check) => check.name === 'aud一致' && !check.ok), true);
  });
});
