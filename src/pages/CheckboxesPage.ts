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

  async getStates(): Promise<boolean[]> {
    const all = await this.checkboxes.all();
    return Promise.all(all.map((c) => c.isChecked()));
  }

  async toggle(index: number): Promise<void> {
    await this.checkboxAt(index).click();
  }
}
