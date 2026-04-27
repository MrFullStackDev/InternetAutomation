import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { config } from '../../src/utils/config.js';

test.describe('Form Authentication', () => {
  test('logs in with valid credentials @smoke', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(config.formAuth.username, config.formAuth.password);
    await expect(page).toHaveURL(/\/secure$/);
    await expect(loginPage.secureAreaHeading).toBeVisible();
    expect(await loginPage.flashText()).toContain('You logged into a secure area!');
  });

  test('rejects invalid username', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(config.formAuth.invalidUsername, config.formAuth.password);
    expect(await loginPage.flashText()).toContain('Your username is invalid!');
  });

  test('rejects invalid password', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(config.formAuth.username, config.formAuth.invalidPassword);
    expect(await loginPage.flashText()).toContain('Your password is invalid!');
  });

  test('logs out and returns to login page', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(config.formAuth.username, config.formAuth.password);
    await loginPage.logout();
    await expect(page).toHaveURL(/\/login$/);
    expect(await loginPage.flashText()).toContain('You logged out of the secure area!');
  });
});
