import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('JavaScript Alerts', () => {
  test('handles alert dialog @smoke', async ({ jsAlertsPage }) => {
    await jsAlertsPage.goto();
    const message = await jsAlertsPage.trigger('alert');
    expect(message).toBe('I am a JS Alert');
    expect(await jsAlertsPage.resultText()).toBe('You successfully clicked an alert');
  });

  test('handles confirm dismiss', async ({ jsAlertsPage }) => {
    await jsAlertsPage.goto();
    await jsAlertsPage.trigger('confirm', { accept: false });
    expect(await jsAlertsPage.resultText()).toBe('You clicked: Cancel');
  });

  test('handles prompt with text', async ({ jsAlertsPage }) => {
    await jsAlertsPage.goto();
    await jsAlertsPage.trigger('prompt', { promptText: 'playwright!' });
    expect(await jsAlertsPage.resultText()).toBe('You entered: playwright!');
  });
});
