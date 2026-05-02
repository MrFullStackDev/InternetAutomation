import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Horizontal Slider', () => {
  test('moves the slider with arrow keys @regression', async ({ horizontalSliderPage }) => {
    await horizontalSliderPage.goto();
    await horizontalSliderPage.setValue(2.5);
    await expect(horizontalSliderPage.valueDisplay).toHaveText('2.5');
  });
});
