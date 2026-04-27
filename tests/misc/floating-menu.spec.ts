import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Floating Menu', () => {
  test('menu is visible after scrolling to the bottom', async ({ floatingMenuPage }) => {
    await floatingMenuPage.goto();
    await floatingMenuPage.scrollToBottom();
    expect(await floatingMenuPage.menuIsVisible()).toBe(true);
    await expect(floatingMenuPage.homeLink).toBeVisible();
  });
});
