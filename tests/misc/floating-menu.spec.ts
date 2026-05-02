import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Floating Menu', () => {
  test('menu is visible after scrolling to the bottom @regression', async ({ floatingMenuPage }) => {
    await floatingMenuPage.goto();
    await floatingMenuPage.scrollToBottom();
    await expect(floatingMenuPage.menu).toBeVisible();
    await expect(floatingMenuPage.homeLink).toBeVisible();
  });
});
