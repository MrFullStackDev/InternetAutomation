import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Frames', () => {
  test('frames index lists Nested Frames and iFrame links @smoke', async ({ framesPage }) => {
    await framesPage.goto();
    await expect(framesPage.nestedFramesLink).toBeVisible();
    await expect(framesPage.iframeLink).toBeVisible();
  });

  // The TinyMCE demo on the live site renders the editor in read-only mode (the body has
  // `mce-content-readonly` and an "upgrade" notice intercepts pointer events). We can
  // still verify the iframe and toolbar render.
  test('iFrame editor renders with toolbar @regression', async ({ iframePage, page }) => {
    await iframePage.goto();
    await expect(page.locator('#mce_0_ifr')).toBeVisible();
    await expect(page.locator('button[title="Bold"]')).toBeVisible();
  });
});
