import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class BrokenImagesPage extends BasePage {
  readonly path = '/broken_images';

  get images(): Locator {
    return this.page.locator('div.example img');
  }

  async imageSources(): Promise<(string | null)[]> {
    const imgs = await this.images.all();
    return Promise.all(imgs.map((img) => img.getAttribute('src')));
  }

  async naturalWidths(): Promise<number[]> {
    return this.images.evaluateAll((els) => els.map((el) => (el as HTMLImageElement).naturalWidth));
  }
}
