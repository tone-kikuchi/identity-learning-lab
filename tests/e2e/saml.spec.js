import { expect, test } from '@playwright/test';

test('SAML-like login flow reaches protected page', async ({ page }) => {
  await page.goto('/saml.html');

  await Promise.all([
    page.waitForLoadState('load'),
    page.getByRole('button', { name: 'このデモを初期化' }).click()
  ]);

  await page.getByRole('link', { name: 'SPでログイン開始' }).click();
  await page.getByRole('button', { name: 'IdPへ移動' }).click();

  const loginHeading = page.getByRole('heading', { name: 'IdP ログイン' });
  try {
    await loginHeading.waitFor({ timeout: 2000 });
    const userSelect = page.locator('select[name="userId"]');
    const firstOptionValue = await userSelect.locator('option').first().getAttribute('value');
    await userSelect.selectOption(firstOptionValue || '');
    await page.getByRole('button', { name: 'ログイン' }).click();
  } catch (error) {
    // Already authenticated, continue to the SSO screen.
  }

  await page.getByRole('heading', { name: 'IdP SSO (SAML-like)' }).waitFor();
  await page.getByRole('button', { name: 'Generate & POST' }).click();

  await page.getByRole('heading', { name: 'ACS 検証' }).waitFor();
  await expect(page.getByText('検証成功')).toBeVisible();

  await page.getByRole('link', { name: '保護ページへ進む' }).click();
  await expect(page.getByRole('heading', { name: '保護ページ' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '今回のフローまとめ (SAML-like)' })).toBeVisible();
});
