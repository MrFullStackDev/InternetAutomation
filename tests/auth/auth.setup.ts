import path from 'node:path';
import { test as setup, expect } from '@playwright/test';
import { config } from '../../src/utils/config.js';
import { ROOT_DIR } from '../../src/utils/paths.js';

export const AUTH_STATE_PATH = path.join(ROOT_DIR, '.auth', 'form-auth.json');

setup('authenticate as form user', async ({ page }) => {
  await page.goto(`${config.baseUrl}/login`);
  await page.getByLabel('Username').fill(config.formAuth.username);
  await page.getByLabel('Password').fill(config.formAuth.password);
  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/\/secure$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Secure Area' })).toBeVisible();

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
