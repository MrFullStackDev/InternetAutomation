import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Infinite Scroll', () => {
  test('loads more paragraphs as we scroll @smoke', async ({ infiniteScrollPage }) => {
    await infiniteScrollPage.goto();
    const initial = await infiniteScrollPage.paragraphCount();
    const after = await infiniteScrollPage.scrollUntilCount(initial + 3);
    expect(after).toBeGreaterThanOrEqual(initial + 3);
  });
});
