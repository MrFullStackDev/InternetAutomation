import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ABTestPage extends BasePage {
  readonly path = '/abtest';

  get heading(): Locator {
    return this.page.locator('div.example h3');
  }
}
