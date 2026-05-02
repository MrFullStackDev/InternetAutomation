import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Notification Messages', () => {
  test('always renders one of the known notification strings @regression', async ({ notificationMessagePage }) => {
    await notificationMessagePage.goto();
    await notificationMessagePage.triggerNotification();
    await expect(notificationMessagePage.flash).toContainText(
      /(Action successful|Action unsuccesful, please try again|Action unsuccessful, please try again)/,
    );
  });
});
