import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Notification Messages', () => {
  test('always renders one of the known notification strings', async ({ notificationMessagePage }) => {
    await notificationMessagePage.goto();
    const message = await notificationMessagePage.clickAndGetMessage();
    expect(message).toMatch(/(Action successful|Action unsuccesful, please try again|Action unsuccessful, please try again)/);
  });
});
