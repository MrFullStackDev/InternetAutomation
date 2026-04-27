import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Inputs', () => {
  test('accepts numeric input', async ({ inputsPage }) => {
    await inputsPage.goto();
    await inputsPage.typeNumber('42');
    expect(await inputsPage.value()).toBe('42');
  });

  test('arrow keys increment and decrement', async ({ inputsPage }) => {
    await inputsPage.goto();
    await inputsPage.typeNumber('5');
    await inputsPage.pressArrow('Up');
    expect(await inputsPage.value()).toBe('6');
    await inputsPage.pressArrow('Down');
    expect(await inputsPage.value()).toBe('5');
  });
});
