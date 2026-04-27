import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Geolocation', () => {
  test.use({
    geolocation: { latitude: 47.6062, longitude: -122.3321 },
    permissions: ['geolocation'],
  });

  test('reports the mocked latitude and longitude', async ({ geolocationPage }) => {
    await geolocationPage.goto();
    await geolocationPage.detect();
    await expect(geolocationPage.latitude).toContainText('47.6062');
    await expect(geolocationPage.longitude).toContainText('-122.3321');
  });
});
