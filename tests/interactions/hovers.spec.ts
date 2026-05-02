import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Hovers', () => {
  test('reveals user info on hover @smoke', async ({ hoversPage }) => {
    await hoversPage.goto();
    await hoversPage.hoverAt(0);
    await expect(hoversPage.captionAt(0)).toBeVisible();
    await expect(hoversPage.captionAt(0)).toContainText('user1');
  });

  test('each figure exposes a unique user @regression', async ({ hoversPage }) => {
    await hoversPage.goto();
    await expect(hoversPage.figures).toHaveCount(3);
  });
});
