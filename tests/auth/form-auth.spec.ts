import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { config } from '../../src/utils/config.js';

test.describe('Form Authentication', () => {
  test('logs in with valid credentials @smoke @critical', async ({ loginPage, page }) => {
    await test.step('navigate to login page', async () => {
      await loginPage.goto();
    });

    await test.step('submit valid credentials', async () => {
      await loginPage.login(config.formAuth.username, config.formAuth.password);
    });

    await test.step('verify redirect to secure area', async () => {
      await expect(page).toHaveURL(/\/secure$/);
      await expect(loginPage.secureAreaHeading).toBeVisible();
      await expect(loginPage.flashMessage).toContainText('You logged into a secure area!');
    });
  });

  test('rejects invalid username @regression', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(config.formAuth.invalidUsername, config.formAuth.password);
    await expect(loginPage.flashMessage).toContainText('Your username is invalid!');
  });

  test('rejects invalid password @regression', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(config.formAuth.username, config.formAuth.invalidPassword);
    await expect(loginPage.flashMessage).toContainText('Your password is invalid!');
  });

  test('logs out and returns to login page @regression', async ({ loginPage, page }) => {
    await test.step('log in', async () => {
      await loginPage.goto();
      await loginPage.login(config.formAuth.username, config.formAuth.password);
    });

    await test.step('log out', async () => {
      await loginPage.logout();
    });

    await test.step('verify back at login page', async () => {
      await expect(page).toHaveURL(/\/login$/);
      await expect(loginPage.flashMessage).toContainText('You logged out of the secure area!');
    });
  });
});
