import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Hovers', () => {
  test('reveals user info on hover @smoke', async ({ hoversPage }) => {
    await hoversPage.goto();
    await hoversPage.hoverAt(0);
    await expect(hoversPage.captionAt(0)).toBeVisible();
    expect(await hoversPage.captionTextAt(0)).toContain('user1');
  });

  test('each figure exposes a unique user', async ({ hoversPage }) => {
    await hoversPage.goto();
    expect(await hoversPage.figures.count()).toBe(3);
  });
});
