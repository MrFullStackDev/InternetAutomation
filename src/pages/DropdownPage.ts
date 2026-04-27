import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class DropdownPage extends BasePage {
  readonly path = '/dropdown';

  get dropdown(): Locator {
    return this.page.locator('#dropdown');
  }

  async selectByValue(value: string): Promise<void> {
    await this.dropdown.selectOption(value);
  }

  async selectByLabel(label: string): Promise<void> {
    await this.dropdown.selectOption({ label });
  }

  async selectedValue(): Promise<string> {
    return this.dropdown.inputValue();
  }

  async options(): Promise<string[]> {
    return this.dropdown.locator('option').allInnerTexts();
  }
}
