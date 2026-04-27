import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Horizontal Slider', () => {
  test('moves the slider with arrow keys', async ({ horizontalSliderPage }) => {
    await horizontalSliderPage.goto();
    await horizontalSliderPage.setValue(2.5);
    expect(await horizontalSliderPage.displayedValue()).toBe('2.5');
  });
});
