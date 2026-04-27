import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Add / Remove Elements', () => {
  test('adds and removes elements @smoke', async ({ addRemoveElementsPage }) => {
    await addRemoveElementsPage.goto();
    expect(await addRemoveElementsPage.deleteElementCount()).toBe(0);
    await addRemoveElementsPage.addElements(3);
    expect(await addRemoveElementsPage.deleteElementCount()).toBe(3);
    await addRemoveElementsPage.deleteElementAt(1);
    expect(await addRemoveElementsPage.deleteElementCount()).toBe(2);
  });
});
