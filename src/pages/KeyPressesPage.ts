import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class KeyPressesPage extends BasePage {
  readonly path = '/key_presses';

  get target(): Locator {
    return this.page.locator('#target');
  }
  get result(): Locator {
    return this.page.locator('#result');
  }

  async pressKey(key: string): Promise<void> {
    await this.target.click();
    await this.page.keyboard.press(key);
  }

  async lastKeyText(): Promise<string> {
    return (await this.result.innerText()).trim();
  }
}
