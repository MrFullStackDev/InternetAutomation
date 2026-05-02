import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('A/B Testing', () => {
  test('renders one of the A/B variants @regression', async ({ abTestPage }) => {
    await abTestPage.goto();
    await expect(abTestPage.heading).toHaveText(/A\/B Test (Variation 1|Control)/i);
  });
});
