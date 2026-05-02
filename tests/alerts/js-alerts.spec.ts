import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('JavaScript Alerts', () => {
  test('handles alert dialog @smoke', async ({ jsAlertsPage }) => {
    await jsAlertsPage.goto();
    const message = await jsAlertsPage.trigger('alert');
    expect(message).toBe('I am a JS Alert');
    await expect(jsAlertsPage.result).toHaveText('You successfully clicked an alert');
  });

  test('handles confirm dismiss @regression', async ({ jsAlertsPage }) => {
    await jsAlertsPage.goto();
    await jsAlertsPage.trigger('confirm', { accept: false });
    await expect(jsAlertsPage.result).toHaveText('You clicked: Cancel');
  });

  test('handles prompt with text @regression', async ({ jsAlertsPage }) => {
    await jsAlertsPage.goto();
    await jsAlertsPage.trigger('prompt', { promptText: 'playwright!' });
    await expect(jsAlertsPage.result).toHaveText('You entered: playwright!');
  });
});
