import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHmac } from 'node:crypto';

import { hmacSha256Hex, stableStringify } from '../../shared/crypto.js';

const hmacHex = (message, secret) =>
  createHmac('sha256', secret).update(message).digest('hex');

describe('crypto utilities', () => {
  it('stableStringify sorts keys recursively', () => {
    const input = {
      beta: 1,
      alpha: {
        d: 4,
        c: 3
      },
      gamma: [2, 1]
    };

    assert.equal(stableStringify(input), '{"alpha":{"c":3,"d":4},"beta":1,"gamma":[2,1]}');
  });

  it('hmacSha256Hex matches node crypto output', async () => {
    const message = 'sign-me';
    const secret = 'super-secret';

    const expected = hmacHex(message, secret);
    const actual = await hmacSha256Hex(message, secret);
    assert.equal(actual, expected);
  });
});
