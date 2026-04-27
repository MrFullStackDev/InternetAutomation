import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('File Download', () => {
  test('lists at least one downloadable file', async ({ fileDownloadPage }) => {
    await fileDownloadPage.goto();
    const names = await fileDownloadPage.availableFiles();
    expect(names.length).toBeGreaterThan(0);
  });

  test('downloads a file and yields a non-empty filename @smoke', async ({ fileDownloadPage }) => {
    await fileDownloadPage.goto();
    const download = await fileDownloadPage.downloadFirst();
    expect(download.suggestedFilename().length).toBeGreaterThan(0);
  });
});
