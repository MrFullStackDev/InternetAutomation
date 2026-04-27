import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Slow Resources', () => {
  test.setTimeout(45_000);

  test('eventually loads despite slow resource', async ({ slowResourcesPage }) => {
    await slowResourcesPage.goto();
    await expect(slowResourcesPage.heading_).toContainText(/Slow Resources/i);
  });
});
