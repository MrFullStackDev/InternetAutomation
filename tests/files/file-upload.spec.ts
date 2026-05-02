import path from 'node:path';
import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { fixturePath } from '../../src/utils/paths.js';

test.describe('File Upload', () => {
  test('uploads a fixture file @smoke', async ({ fileUploadPage }) => {
    await fileUploadPage.goto();
    await fileUploadPage.upload(fixturePath('sample-upload.txt'));
    await expect(fileUploadPage.uploadedFiles).toContainText('sample-upload.txt');
  });

  test('uploads via setInputFiles even with relative-style path @regression', async ({ fileUploadPage }) => {
    await fileUploadPage.goto();
    const abs = path.resolve(fixturePath('sample-upload.txt'));
    await fileUploadPage.upload(abs);
    await expect(fileUploadPage.uploadedFiles).toContainText('sample-upload.txt');
  });
});
