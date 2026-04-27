import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class GeolocationPage extends BasePage {
  readonly path = '/geolocation';

  get whereAmIButton(): Locator {
    return this.page.locator('button', { hasText: 'Where am I?' });
  }
  get latitude(): Locator {
    return this.page.locator('#lat-value');
  }
  get longitude(): Locator {
    return this.page.locator('#long-value');
  }

  async detect(): Promise<void> {
    await this.whereAmIButton.click();
  }
}
