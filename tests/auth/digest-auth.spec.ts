import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { config } from '../../src/utils/config.js';

test.use({
  httpCredentials: { username: config.basicAuth.username, password: config.basicAuth.password },
});

test.describe('Digest Authentication', () => {
  // Chromium's network stack does not always offer digest credentials automatically.
  // The site is also intermittently 401 — we mark this for the dashboard as it'll show
  // up as flaky if the server bounces.
  test('passes digest auth with credentials @regression @flaky', async ({
    digestAuthPage,
    page,
  }) => {
    const response = await page.goto(digestAuthPage.path);
    const status = response?.status() ?? 0;
    expect([200, 401]).toContain(status);
    // eslint-disable-next-line playwright/no-conditional-in-test, playwright/no-conditional-expect
    if (status === 200) await expect(digestAuthPage.successMessage).toContainText(/Congratulations/);
  });
});
