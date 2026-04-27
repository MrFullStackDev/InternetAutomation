import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Dropdown', () => {
  test('selects each available option @smoke', async ({ dropdownPage }) => {
    await dropdownPage.goto();
    await dropdownPage.selectByValue('1');
    expect(await dropdownPage.selectedValue()).toBe('1');
    await dropdownPage.selectByValue('2');
    expect(await dropdownPage.selectedValue()).toBe('2');
  });

  test('selects by visible label', async ({ dropdownPage }) => {
    await dropdownPage.goto();
    await dropdownPage.selectByLabel('Option 1');
    expect(await dropdownPage.selectedValue()).toBe('1');
  });
});
