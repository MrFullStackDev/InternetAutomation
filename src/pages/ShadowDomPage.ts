import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ShadowDomPage extends BasePage {
  readonly path = '/shadowdom';

  get shadowList(): Locator {
    return this.page.locator('my-paragraph ul li');
  }

  async listItems(): Promise<string[]> {
    return this.shadowList.allInnerTexts();
  }
}
