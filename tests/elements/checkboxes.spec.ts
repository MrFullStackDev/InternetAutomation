import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Checkboxes', () => {
  test('renders two checkboxes with mixed initial state @smoke', async ({ checkboxesPage }) => {
    await checkboxesPage.goto();
    await expect(checkboxesPage.checkboxes).toHaveCount(2);
    await expect(checkboxesPage.checkboxAt(0)).not.toBeChecked();
    await expect(checkboxesPage.checkboxAt(1)).toBeChecked();
  });

  test('toggling flips both checkboxes @regression', async ({ checkboxesPage }) => {
    await checkboxesPage.goto();
    await checkboxesPage.toggle(0);
    await checkboxesPage.toggle(1);
    await expect(checkboxesPage.checkboxAt(0)).toBeChecked();
    await expect(checkboxesPage.checkboxAt(1)).not.toBeChecked();
  });
});
