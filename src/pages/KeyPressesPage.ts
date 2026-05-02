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
    // The input is wrapped in a <form>, so focusing it would submit on Enter.
    // The page's keydown listener is on document — body focus is enough.
    await this.page.locator('body').click();
    await this.page.keyboard.press(key);
  }
}
