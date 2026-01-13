import { expect, test } from '@playwright/test';

test('OIDC-like login flow reaches protected page', async ({ page }) => {
  await page.goto('/oidc.html');

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
    // Already authenticated.
  }

  await page.getByRole('heading', { name: 'IdP /authorize (OIDC-like)' }).waitFor();
  await page.getByRole('button', { name: 'redirect_uriへ戻る' }).click();

  await page.getByRole('heading', { name: 'SP Callback (OIDC-like)' }).waitFor();
  await expect(page.getByText('検証成功')).toBeVisible();

  await page.getByRole('link', { name: '保護ページへ進む' }).click();
  await expect(page.getByRole('heading', { name: '保護ページ' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '今回のフローまとめ (OIDC-like)' })).toBeVisible();
});
