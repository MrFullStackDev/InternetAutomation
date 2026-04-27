import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Dynamic Content', () => {
  test('renders at least three text blocks with content', async ({ dynamicContentPage }) => {
    await dynamicContentPage.goto();
    const blocks = await dynamicContentPage.textBlocks();
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    for (const text of blocks) expect(text.trim().length).toBeGreaterThan(20);
  });

  test('still has at least three blocks after a refresh', async ({ dynamicContentPage }) => {
    await dynamicContentPage.goto();
    const first = await dynamicContentPage.textBlocks();
    await dynamicContentPage.goto();
    const second = await dynamicContentPage.textBlocks();
    expect(first.length).toBeGreaterThanOrEqual(3);
    expect(second.length).toBeGreaterThanOrEqual(3);
  });
});
