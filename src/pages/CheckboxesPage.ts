import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class CheckboxesPage extends BasePage {
  readonly path = '/checkboxes';

  get checkboxes(): Locator {
    return this.page.locator('#checkboxes input[type="checkbox"]');
  }

  checkboxAt(index: number): Locator {
    return this.checkboxes.nth(index);
  }

  async toggle(index: number): Promise<void> {
    await this.checkboxAt(index).click();
  }
}
