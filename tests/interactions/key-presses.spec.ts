import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Key Presses', () => {
  test('reports the last key pressed @smoke', async ({ keyPressesPage }) => {
    await keyPressesPage.goto();
    await keyPressesPage.pressKey('Enter');
    await expect(keyPressesPage.result).toHaveText('You entered: ENTER');
    await keyPressesPage.pressKey('Tab');
    await expect(keyPressesPage.result).toHaveText('You entered: TAB');
  });
});
