import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class SecureFileDownloadPage extends BasePage {
  readonly path = '/download_secure';

  get downloadLinks(): Locator {
    return this.page.locator('div.example a');
  }

  get heading(): Locator {
    return this.page.locator('h3');
  }
}
