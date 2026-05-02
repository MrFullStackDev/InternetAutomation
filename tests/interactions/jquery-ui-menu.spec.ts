import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('JQuery UI Menu', () => {
  test('hovers Enabled and reveals nested menu @regression', async ({ jqueryUiMenuPage }) => {
    await jqueryUiMenuPage.goto();
    await jqueryUiMenuPage.hoverEnabled();
    await jqueryUiMenuPage.hoverDownloads();
    await expect(jqueryUiMenuPage.pdfDownload).toBeVisible();
  });
});
