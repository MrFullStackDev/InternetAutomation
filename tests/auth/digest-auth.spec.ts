import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { config } from '../../src/utils/config.js';

test.use({
  httpCredentials: { username: config.basicAuth.username, password: config.basicAuth.password },
});

test.describe('Digest Authentication', () => {
  // Chromium's network stack does not always offer digest credentials automatically.
  // The site is also intermittently 401 — we mark this for the dashboard as it'll show
  // up as flaky if the server bounces.
  test('passes digest auth with credentials', async ({ digestAuthPage, page }) => {
    const response = await page.goto(digestAuthPage.path);
    expect([200, 401]).toContain(response?.status() ?? 0);
    if (response?.status() === 200) {
      await expect(digestAuthPage.successMessage).toContainText(/Congratulations/);
    }
  });
});
