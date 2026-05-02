import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { config } from '../../src/utils/config.js';

test.describe('Secure File Download', () => {
  test('returns 401 without credentials @regression', async ({ page, secureFileDownloadPage }) => {
    const response = await page.goto(secureFileDownloadPage.path);
    expect(response?.status()).toBe(401);
  });

  test.describe('with credentials', () => {
    test.use({
      httpCredentials: { username: config.basicAuth.username, password: config.basicAuth.password },
    });

    test('lists secure files @regression', async ({ secureFileDownloadPage }) => {
      await secureFileDownloadPage.goto();
      await expect(secureFileDownloadPage.heading).toContainText(/Secure File Down/i);
      await expect(secureFileDownloadPage.downloadLinks.first()).toBeAttached();
    });
  });
});
