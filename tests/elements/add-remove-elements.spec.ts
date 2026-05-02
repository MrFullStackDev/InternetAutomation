import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Add / Remove Elements', () => {
  test('adds and removes elements @smoke', async ({ addRemoveElementsPage }) => {
    await addRemoveElementsPage.goto();
    await expect(addRemoveElementsPage.deleteButtons).toHaveCount(0);
    await addRemoveElementsPage.addElements(3);
    await expect(addRemoveElementsPage.deleteButtons).toHaveCount(3);
    await addRemoveElementsPage.deleteElementAt(1);
    await expect(addRemoveElementsPage.deleteButtons).toHaveCount(2);
  });
});
