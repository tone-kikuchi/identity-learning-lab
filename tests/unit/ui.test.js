import assert from 'node:assert/strict';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import { getUserProfilePresentation, renderLearningNav } from '../../shared/ui.js';

test('getUserProfilePresentation prioritizes display data and group icon', () => {
  const result = getUserProfilePresentation({
    displayName: 'Alice',
    username: 'alice@example.com',
    groups: ['engineering']
  });

  assert.equal(result.displayName, 'Alice');
  assert.equal(result.handle, 'alice@example.com');
  assert.deepEqual(result.groups, ['engineering']);
  assert.equal(result.icon, '🛠️');
});

test('getUserProfilePresentation falls back to user identifiers', () => {
  const result = getUserProfilePresentation({
    email: 'guest@example.com'
  });

  assert.equal(result.displayName, 'guest@example.com');
  assert.equal(result.handle, 'guest@example.com');
  assert.equal(result.icon, '👤');
});

test('renderLearningNav highlights current step and builds next link', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.com' });
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;

  try {
    const nav = renderLearningNav({
      demo: 'saml',
      currentStep: 'admin',
      nextUrl: 'admin/index.html',
      basePath: '..'
    });
    const activeStep = nav.querySelector('.learning-step.active .learning-step-label');
    assert.equal(activeStep?.textContent, '管理設定');
    const nextLink = nav.querySelector('a.button');
    assert.ok(nextLink);
    assert.ok(nextLink.getAttribute('href')?.includes('demo=saml'));
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
  }
});
