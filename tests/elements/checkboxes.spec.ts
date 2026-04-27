import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Checkboxes', () => {
  test('renders two checkboxes with mixed initial state @smoke', async ({ checkboxesPage }) => {
    await checkboxesPage.goto();
    expect(await checkboxesPage.checkboxes.count()).toBe(2);
    expect(await checkboxesPage.getStates()).toEqual([false, true]);
  });

  test('toggling flips both checkboxes', async ({ checkboxesPage }) => {
    await checkboxesPage.goto();
    await checkboxesPage.toggle(0);
    await checkboxesPage.toggle(1);
    expect(await checkboxesPage.getStates()).toEqual([true, false]);
  });
});
