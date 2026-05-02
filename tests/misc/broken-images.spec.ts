import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Broken Images', () => {
  test('detects broken image elements via naturalWidth @regression', async ({ brokenImagesPage }) => {
    await brokenImagesPage.goto();
    const widths = await brokenImagesPage.naturalWidths();
    expect(widths.length).toBeGreaterThanOrEqual(3);
    const broken = widths.filter((w) => w === 0);
    // The page intentionally serves at least two broken images.
    expect(broken.length).toBeGreaterThanOrEqual(1);
  });
});
