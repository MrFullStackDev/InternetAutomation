import { test, expect } from '../src/fixtures/pageFixtures.js';

test.describe('Home page', () => {
  test('lists challenges and welcomes the user @smoke', async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.heading).toHaveText(/Welcome to the-internet/i);
    const challenges = await homePage.listChallenges();
    expect(challenges.length).toBeGreaterThan(30);
    expect(challenges).toEqual(expect.arrayContaining(['Form Authentication', 'Dynamic Loading']));
  });

  test('navigates to a chosen challenge @regression', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.openChallenge('Form Authentication');
    await expect(page).toHaveURL(/\/login$/);
  });
});
