import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Exit Intent', () => {
  test('triggers modal when the cursor leaves through the top', async ({ exitIntentPage }) => {
    await exitIntentPage.goto();
    await exitIntentPage.triggerExitIntent();
    await expect(exitIntentPage.modal).toBeVisible({ timeout: 5_000 });
    await exitIntentPage.closeModal();
    await expect(exitIntentPage.modal).toBeHidden();
  });
});
