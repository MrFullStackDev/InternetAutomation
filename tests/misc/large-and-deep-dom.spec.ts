import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Large and Deep DOM', () => {
  test('renders a 50-row table @regression', async ({ largeAndDeepDomPage }) => {
    await largeAndDeepDomPage.goto();
    await expect(largeAndDeepDomPage.tableRows).toHaveCount(50);
  });
});
