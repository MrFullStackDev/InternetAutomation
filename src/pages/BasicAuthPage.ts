import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class BasicAuthPage extends BasePage {
  readonly path = '/basic_auth';

  get successMessage(): Locator {
    return this.page.locator('div.example p');
  }
}
