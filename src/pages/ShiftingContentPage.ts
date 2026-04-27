import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

type Variant = 'menu' | 'image' | 'list';

export class ShiftingContentPage extends BasePage {
  readonly path = '/shifting_content';

  static variantPath(variant: Variant): string {
    return `/shifting_content/${variant}`;
  }

  async openVariant(variant: Variant): Promise<void> {
    await this.page.goto(ShiftingContentPage.variantPath(variant));
  }

  get menuItems(): Locator {
    return this.page.locator('.example ul li a');
  }

  get image(): Locator {
    return this.page.locator('.example img');
  }
}
