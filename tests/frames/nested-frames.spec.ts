import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Nested Frames', () => {
  test('reads text from each named frame @smoke', async ({ nestedFramesPage }) => {
    await nestedFramesPage.goto();
    await expect(nestedFramesPage.leftFrame.locator('body')).toContainText('LEFT');
    await expect(nestedFramesPage.middleFrame.locator('#content')).toContainText('MIDDLE');
    await expect(nestedFramesPage.rightFrame.locator('body')).toContainText('RIGHT');
    await expect(nestedFramesPage.bottomFrame.locator('body')).toContainText('BOTTOM');
  });
});
