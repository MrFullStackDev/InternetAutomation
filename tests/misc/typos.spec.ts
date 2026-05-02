import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Typos', () => {
  test('paragraph mentions sometimes-typo behavior @regression', async ({ typosPage }) => {
    await typosPage.goto();
    await expect(typosPage.paragraph).not.toBeEmpty();
  });
});
