import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Shifting Content', () => {
  test('menu variant exposes shifting menu items', async ({ shiftingContentPage }) => {
    await shiftingContentPage.openVariant('menu');
    const count = await shiftingContentPage.menuItems.count();
    expect(count).toBeGreaterThan(3);
  });

  test('image variant renders an image', async ({ shiftingContentPage }) => {
    await shiftingContentPage.openVariant('image');
    await expect(shiftingContentPage.image).toBeVisible();
  });
});
