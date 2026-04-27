import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Large and Deep DOM', () => {
  test('renders a 50-row table', async ({ largeAndDeepDomPage }) => {
    await largeAndDeepDomPage.goto();
    expect(await largeAndDeepDomPage.tableRowCount()).toBe(50);
  });
});
