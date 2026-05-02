import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { StatusCodesPage } from '../../src/pages/StatusCodesPage.js';

const codes = [200, 301, 404, 500] as const;

test.describe('Status Codes', () => {
  test('lists all four status code links @smoke', async ({ statusCodesPage }) => {
    await statusCodesPage.goto();
    await expect(statusCodesPage.codeLinks).toHaveCount(4);
  });

  for (const code of codes) {
    test(`navigating to /status_codes/${code} returns ${code} @regression`, async ({ page }) => {
      const response = await page.goto(StatusCodesPage.codePath(code));
      expect(response?.status()).toBe(code);
    });
  }
});
