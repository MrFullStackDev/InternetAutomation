import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class InputsPage extends BasePage {
  readonly path = '/inputs';

  get numberInput(): Locator {
    return this.page.locator('input[type="number"]');
  }

  async typeNumber(value: string): Promise<void> {
    await this.numberInput.fill(value);
  }

  async pressArrow(direction: 'Up' | 'Down'): Promise<void> {
    await this.numberInput.focus();
    await this.page.keyboard.press(`Arrow${direction}`);
  }
}
