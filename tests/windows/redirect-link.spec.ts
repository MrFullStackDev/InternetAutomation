import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Redirect Link', () => {
  test('follows the redirect to /status_codes @regression', async ({ redirectorPage, page }) => {
    await redirectorPage.goto();
    await redirectorPage.followRedirect();
    await expect(page).toHaveURL(/\/status_codes$/);
  });
});
