import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class HoversPage extends BasePage {
  readonly path = '/hovers';

  get figures(): Locator {
    return this.page.locator('.figure');
  }

  figureAt(index: number): Locator {
    return this.figures.nth(index);
  }

  captionAt(index: number): Locator {
    return this.figureAt(index).locator('.figcaption');
  }

  async hoverAt(index: number): Promise<void> {
    await this.figureAt(index).hover();
  }

  async captionTextAt(index: number): Promise<string> {
    return (await this.captionAt(index).innerText()).trim();
  }
}
