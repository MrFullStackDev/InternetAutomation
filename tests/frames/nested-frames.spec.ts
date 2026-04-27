import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Nested Frames', () => {
  test('reads text from each named frame @smoke', async ({ nestedFramesPage }) => {
    await nestedFramesPage.goto();
    expect(await nestedFramesPage.leftFrameText()).toContain('LEFT');
    expect(await nestedFramesPage.middleFrameText()).toContain('MIDDLE');
    expect(await nestedFramesPage.rightFrameText()).toContain('RIGHT');
    expect(await nestedFramesPage.bottomFrameText()).toContain('BOTTOM');
  });
});
