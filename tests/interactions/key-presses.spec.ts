import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Key Presses', () => {
  test('reports the last key pressed @smoke', async ({ keyPressesPage }) => {
    await keyPressesPage.goto();
    await keyPressesPage.pressKey('Enter');
    expect(await keyPressesPage.lastKeyText()).toBe('You entered: ENTER');
    await keyPressesPage.pressKey('Tab');
    expect(await keyPressesPage.lastKeyText()).toBe('You entered: TAB');
  });
});
