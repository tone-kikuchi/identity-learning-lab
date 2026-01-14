import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const modulePages = [
  'admin/app_edit.html',
  'admin/index.html',
  'idp/authorize.html',
  'idp/index.html',
  'idp/login.html',
  'idp/sso_saml.html',
  'sp/acs.html',
  'sp/acs_receive.html',
  'sp/app.html',
  'sp/callback.html',
  'sp/index.html',
  'sp/login_oidc.html',
  'sp/login_saml.html'
];

test('module pages wrap script logic in an init function', async () => {
  const repoRoot = path.resolve('.');
  await Promise.all(
    modulePages.map(async (relativePath) => {
      const fullPath = path.join(repoRoot, relativePath);
      const contents = await fs.readFile(fullPath, 'utf8');
      assert.match(
        contents,
        /const init = \(\) => \{/,
        `${relativePath} should define an init function wrapper`
      );
      assert.match(
        contents,
        /init\(\);/,
        `${relativePath} should invoke init to avoid top-level returns`
      );
    })
  );
});
