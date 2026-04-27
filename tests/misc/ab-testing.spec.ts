import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('A/B Testing', () => {
  test('renders one of the A/B variants', async ({ abTestPage }) => {
    await abTestPage.goto();
    const heading = await abTestPage.headingText();
    expect(heading).toMatch(/A\/B Test (Variation 1|Control)/i);
  });
});
