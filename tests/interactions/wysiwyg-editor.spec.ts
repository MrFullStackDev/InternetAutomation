import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('WYSIWYG Editor', () => {
  // The TinyMCE demo on the live site renders read-only without an API key, so we can't
  // type. Verify the editor frame and bold-toggle render.
  test('editor and toolbar render @regression', async ({ wysiwygEditorPage, page }) => {
    await wysiwygEditorPage.goto();
    await expect(page.locator('iframe').first()).toBeVisible();
    await expect(wysiwygEditorPage.boldButton).toBeVisible();
  });
});
