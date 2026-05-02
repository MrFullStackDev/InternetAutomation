import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Disappearing Elements', () => {
  test('renders a menu with at least the four core links @regression', async ({ disappearingElementsPage }) => {
    await disappearingElementsPage.goto();
    const items = await disappearingElementsPage.menuItemNames();
    expect(items).toEqual(expect.arrayContaining(['Home', 'About', 'Contact Us', 'Portfolio']));
  });
});
