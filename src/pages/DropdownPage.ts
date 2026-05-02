import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class DropdownPage extends BasePage {
  readonly path = '/dropdown';

  get dropdown(): Locator {
    return this.page.getByRole('combobox');
  }

  get options(): Locator {
    return this.dropdown.locator('option');
  }

  async selectByValue(value: string): Promise<void> {
    await this.dropdown.selectOption(value);
  }

  async selectByLabel(label: string): Promise<void> {
    await this.dropdown.selectOption({ label });
  }
}
