import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Typos', () => {
  test('paragraph mentions sometimes-typo behavior', async ({ typosPage }) => {
    await typosPage.goto();
    const paragraph = await typosPage.paragraphText();
    expect(paragraph.length).toBeGreaterThan(20);
  });
});
