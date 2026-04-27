import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ABTestPage extends BasePage {
  readonly path = '/abtest';

  get heading_(): Locator {
    return this.page.locator('div.example h3');
  }

  async headingText(): Promise<string> {
    return (await this.heading_.innerText()).trim();
  }
}
