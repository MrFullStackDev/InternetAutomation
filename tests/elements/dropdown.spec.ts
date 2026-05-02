import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Dropdown', () => {
  test('selects each available option @smoke', async ({ dropdownPage }) => {
    await dropdownPage.goto();
    await dropdownPage.selectByValue('1');
    await expect(dropdownPage.dropdown).toHaveValue('1');
    await dropdownPage.selectByValue('2');
    await expect(dropdownPage.dropdown).toHaveValue('2');
  });

  test('selects by visible label @regression', async ({ dropdownPage }) => {
    await dropdownPage.goto();
    await dropdownPage.selectByLabel('Option 1');
    await expect(dropdownPage.dropdown).toHaveValue('1');
  });
});
