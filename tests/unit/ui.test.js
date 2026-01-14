import assert from 'node:assert/strict';
import test from 'node:test';

import { getUserProfilePresentation } from '../../shared/ui.js';

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
