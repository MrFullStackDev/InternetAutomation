import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Entry Ad', () => {
  test('shows modal on first load and closes it @regression', async ({ entryAdPage }) => {
    await entryAdPage.goto();
    await expect(entryAdPage.modalTitle).toContainText(/This is a modal window/);
    await entryAdPage.closeModal();
    await expect(entryAdPage.modal).toBeHidden();
  });

  // The site uses a cookie to suppress the modal after close. Re-enable resets it,
  // but for determinism we clear context cookies and reload.
  test('re-enabling and clearing cookies brings the modal back @regression', async ({
    entryAdPage,
    context,
  }) => {
    await entryAdPage.goto();
    await entryAdPage.closeModal();
    await entryAdPage.reEnable();
    await context.clearCookies();
    await entryAdPage.goto();
    await expect(entryAdPage.modal).toBeVisible({ timeout: 10_000 });
  });
});
