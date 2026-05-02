import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { config } from '../../src/utils/config.js';

test.use({
  httpCredentials: { username: config.basicAuth.username, password: config.basicAuth.password },
});

test.describe('Basic Authentication', () => {
  test('passes basic auth with credentials @smoke @critical', async ({ basicAuthPage }) => {
    await basicAuthPage.goto();
    await expect(basicAuthPage.successMessage).toContainText('Congratulations');
  });
});

test.describe('Basic Authentication without credentials', () => {
  test.use({ httpCredentials: undefined });

  test('returns 401 without credentials @regression', async ({ page }) => {
    const response = await page.goto('/basic_auth');
    expect(response?.status()).toBe(401);
  });
});
