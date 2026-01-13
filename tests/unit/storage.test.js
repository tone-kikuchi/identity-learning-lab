import { beforeEach, describe, expect, it } from 'vitest';

import { ensureDemoSeed, getJson, getSessionJson, makeKey, normalizeDemo, resetDemo, setJson, setSessionJson } from '../../shared/storage.js';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('storage helpers', () => {
  it('normalizes demo values and builds storage keys', () => {
    expect(normalizeDemo('SAML')).toBe('saml');
    expect(normalizeDemo('unknown')).toBeNull();
    expect(makeKey('oidc', 'apps')).toBe('mockidp.oidc.apps');
  });

  it('stores and retrieves JSON values', () => {
    setJson('saml', 'apps', [{ id: 'app' }]);
    setSessionJson('saml', 'expected', { requestId: 'req' });

    expect(getJson('saml', 'apps')).toEqual([{ id: 'app' }]);
    expect(getSessionJson('saml', 'expected')).toEqual({ requestId: 'req' });
  });

  it('seeds demo data when missing', () => {
    ensureDemoSeed('saml');
    const apps = getJson('saml', 'apps');
    const users = getJson('saml', 'users');

    expect(Array.isArray(apps)).toBe(true);
    expect(Array.isArray(users)).toBe(true);
    expect(apps?.length).toBeGreaterThan(0);
    expect(users?.length).toBeGreaterThan(0);
  });

  it('resets demo data to known defaults', () => {
    setJson('saml', 'apps', []);
    resetDemo('saml');

    expect(getJson('saml', 'eventLog')).toEqual([]);
    expect(getJson('saml', 'spSessions')).toEqual({});
  });
});
