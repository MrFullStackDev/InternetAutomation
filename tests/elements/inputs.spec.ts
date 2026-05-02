import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Inputs', () => {
  test('accepts numeric input @smoke', async ({ inputsPage }) => {
    await inputsPage.goto();
    await inputsPage.typeNumber('42');
    await expect(inputsPage.numberInput).toHaveValue('42');
  });

  test('arrow keys increment and decrement @regression', async ({ inputsPage }) => {
    await inputsPage.goto();
    await inputsPage.typeNumber('5');
    await inputsPage.pressArrow('Up');
    await expect(inputsPage.numberInput).toHaveValue('6');
    await inputsPage.pressArrow('Down');
    await expect(inputsPage.numberInput).toHaveValue('5');
  });
});
