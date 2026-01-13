import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { ensureDemoSeed, getJson, getSessionJson, makeKey, normalizeDemo, resetDemo, resolveDemoSelection, setJson, setSessionJson } from '../../shared/storage.js';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('storage helpers', () => {
  it('normalizes demo values and builds storage keys', () => {
    assert.equal(normalizeDemo('SAML'), 'saml');
    assert.equal(normalizeDemo('unknown'), null);
    assert.equal(makeKey('oidc', 'apps'), 'mockidp.oidc.apps');
  });

  it('stores and retrieves JSON values', () => {
    setJson('saml', 'apps', [{ id: 'app' }]);
    setSessionJson('saml', 'expected', { requestId: 'req' });

    assert.deepEqual(getJson('saml', 'apps'), [{ id: 'app' }]);
    assert.deepEqual(getSessionJson('saml', 'expected'), { requestId: 'req' });
  });

  it('seeds demo data when missing', () => {
    ensureDemoSeed('saml');
    const apps = getJson('saml', 'apps');
    const users = getJson('saml', 'users');

    assert.equal(Array.isArray(apps), true);
    assert.equal(Array.isArray(users), true);
    assert.ok(apps?.length > 0);
    assert.ok(users?.length > 0);
  });

  it('resolves demo selection with query, last demo, and default fallback', () => {
    const locationWithDemo = new URL('https://example.com/admin/app_edit.html?demo=oidc');
    const resultFromQuery = resolveDemoSelection({ location: locationWithDemo, storage: localStorage });
    assert.deepEqual(resultFromQuery, { demo: 'oidc', rawDemo: 'oidc', source: 'query' });

    localStorage.setItem('mockidp.lastDemo', 'saml');
    const locationWithoutDemo = new URL('https://example.com/admin/app_edit.html');
    const resultFromLast = resolveDemoSelection({ location: locationWithoutDemo, storage: localStorage });
    assert.deepEqual(resultFromLast, { demo: 'saml', rawDemo: null, source: 'last' });

    localStorage.clear();
    const resultFromDefault = resolveDemoSelection({ location: locationWithoutDemo, storage: localStorage, fallback: 'saml' });
    assert.deepEqual(resultFromDefault, { demo: 'saml', rawDemo: null, source: 'default' });
  });

  it('reports invalid demo query values', () => {
    const locationWithDemo = new URL('https://example.com/admin/app_edit.html?demo=invalid');
    const result = resolveDemoSelection({ location: locationWithDemo, storage: localStorage });
    assert.deepEqual(result, { demo: null, rawDemo: 'invalid', source: 'query' });
  });

  it('resets demo data to known defaults', () => {
    setJson('saml', 'apps', []);
    resetDemo('saml');

    assert.deepEqual(getJson('saml', 'eventLog'), []);
    assert.deepEqual(getJson('saml', 'spSessions'), {});
  });
});
