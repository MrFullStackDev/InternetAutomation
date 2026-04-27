import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class RedirectorPage extends BasePage {
  readonly path = '/redirector';

  get redirectLink(): Locator {
    return this.page.locator('a#redirect');
  }

  async followRedirect(): Promise<void> {
    await Promise.all([this.page.waitForURL('**/status_codes'), this.redirectLink.click()]);
  }
}
