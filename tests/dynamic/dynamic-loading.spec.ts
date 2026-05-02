import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { DynamicLoadingPage } from '../../src/pages/DynamicLoadingPage.js';

test.describe('Dynamic Loading', () => {
  test('hidden then revealed (variant 1) @smoke', async ({ dynamicLoadingPage }) => {
    await test.step('open variant 1', async () => {
      await dynamicLoadingPage.openVariant(1);
    });

    await test.step('start the dynamic load', async () => {
      await dynamicLoadingPage.start();
    });

    await test.step('wait for revealed content', async () => {
      await expect(dynamicLoadingPage.finishedText).toBeVisible({ timeout: 10_000 });
      await expect(dynamicLoadingPage.finishedText).toHaveText('Hello World!');
    });
  });

  test('not present then rendered (variant 2) @regression', async ({ dynamicLoadingPage }) => {
    await dynamicLoadingPage.openVariant(2);
    await expect(dynamicLoadingPage.finishedText).toHaveCount(0);
    await dynamicLoadingPage.start();
    await expect(dynamicLoadingPage.finishedText).toBeVisible({ timeout: 10_000 });
  });

  test('exposes a static helper for paths @regression', () => {
    expect(DynamicLoadingPage.variantPath(1)).toBe('/dynamic_loading/1');
  });
});
