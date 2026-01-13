import { describe, expect, it } from 'vitest';
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

    expect(stableStringify(input)).toBe('{"alpha":{"c":3,"d":4},"beta":1,"gamma":[2,1]}');
  });

  it('hmacSha256Hex matches node crypto output', async () => {
    const message = 'sign-me';
    const secret = 'super-secret';

    const expected = hmacHex(message, secret);
    await expect(hmacSha256Hex(message, secret)).resolves.toBe(expected);
  });
});
