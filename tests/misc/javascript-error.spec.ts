import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('JavaScript Onload Error', () => {
  test('surfaces a page error on load', async ({ jsErrorPage, page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await jsErrorPage.goto();
    expect(errors.some((e) => /Cannot read prop/i.test(e.message))).toBe(true);
  });
});
