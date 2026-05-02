import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class TyposPage extends BasePage {
  readonly path = '/typos';

  get paragraph(): Locator {
    return this.page.locator('div.example p').nth(1);
  }
}
