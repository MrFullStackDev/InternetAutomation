import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Shadow DOM', () => {
  test('reads list items inside the shadow root @smoke', async ({ shadowDomPage }) => {
    await shadowDomPage.goto();
    const items = await shadowDomPage.listItems();
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.some((t) => t.includes("Let's have some different text!"))).toBe(true);
  });
});
