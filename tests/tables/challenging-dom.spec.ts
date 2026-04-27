import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Challenging DOM', () => {
  test('renders three buttons, a canvas, and a table', async ({ challengingDomPage }) => {
    await challengingDomPage.goto();
    await expect(challengingDomPage.blueButton).toBeVisible();
    await expect(challengingDomPage.redButton).toBeVisible();
    await expect(challengingDomPage.greenButton).toBeVisible();
    await expect(challengingDomPage.canvas).toBeVisible();
    await expect(challengingDomPage.table).toBeVisible();
  });

  test('clicking the blue button does not throw', async ({ challengingDomPage }) => {
    await challengingDomPage.goto();
    await challengingDomPage.clickBlue();
  });
});
