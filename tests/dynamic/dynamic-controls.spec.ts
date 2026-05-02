import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Dynamic Controls', () => {
  test('removes and re-adds the checkbox @smoke', async ({ dynamicControlsPage }) => {
    await dynamicControlsPage.goto();
    await expect(dynamicControlsPage.checkbox).toBeVisible();
    await dynamicControlsPage.toggleCheckbox();
    await expect(dynamicControlsPage.message).toHaveText(/It's gone!/, { timeout: 10_000 });
    await expect(dynamicControlsPage.checkbox).toHaveCount(0);
    await dynamicControlsPage.toggleCheckbox();
    await expect(dynamicControlsPage.message).toHaveText(/It's back!/, { timeout: 10_000 });
    await expect(dynamicControlsPage.checkbox).toBeVisible();
  });

  test('enables and disables the text input @regression', async ({ dynamicControlsPage }) => {
    await dynamicControlsPage.goto();
    await expect(dynamicControlsPage.textInput).toBeDisabled();
    await dynamicControlsPage.toggleTextInput();
    await expect(dynamicControlsPage.message).toHaveText(/It's enabled!/, { timeout: 10_000 });
    await expect(dynamicControlsPage.textInput).toBeEnabled();
  });
});
