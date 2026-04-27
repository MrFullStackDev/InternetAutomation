import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Multiple Windows', () => {
  test('opens a new window with expected content @smoke', async ({ multipleWindowsPage }) => {
    await multipleWindowsPage.goto();
    const popup = await multipleWindowsPage.openNewWindow();
    await expect(popup.locator('h3')).toHaveText('New Window');
    await popup.close();
  });
});
