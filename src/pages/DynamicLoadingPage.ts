import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

type Variant = 1 | 2;

export class DynamicLoadingPage extends BasePage {
  readonly path = '/dynamic_loading';

  static variantPath(variant: Variant): string {
    return `/dynamic_loading/${variant}`;
  }

  async openVariant(variant: Variant): Promise<void> {
    await this.page.goto(DynamicLoadingPage.variantPath(variant));
  }

  get startButton(): Locator {
    return this.page.locator('#start button');
  }
  get loading(): Locator {
    return this.page.locator('#loading');
  }
  get finishedText(): Locator {
    return this.page.locator('#finish h4');
  }

  async start(): Promise<void> {
    await this.startButton.click();
  }
}
