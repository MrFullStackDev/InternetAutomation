import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class SlowResourcesPage extends BasePage {
  readonly path = '/slow';

  get heading_(): Locator {
    return this.page.locator('div.example h3');
  }
}
