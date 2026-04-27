import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class DigestAuthPage extends BasePage {
  readonly path = '/digest_auth';

  get successMessage(): Locator {
    return this.page.locator('div.example p');
  }
}
