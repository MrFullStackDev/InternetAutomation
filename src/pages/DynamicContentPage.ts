import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class DynamicContentPage extends BasePage {
  readonly path = '/dynamic_content';

  get rows(): Locator {
    return this.page.locator('#content .row');
  }

  async textBlocks(): Promise<string[]> {
    return this.page.locator('#content .row .large-10.columns').allInnerTexts();
  }

  async imageSources(): Promise<(string | null)[]> {
    const imgs = await this.page.locator('#content .row img').all();
    return Promise.all(imgs.map((img) => img.getAttribute('src')));
  }
}
