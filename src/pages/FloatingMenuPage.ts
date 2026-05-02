import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class FloatingMenuPage extends BasePage {
  readonly path = '/floating_menu';

  get menu(): Locator {
    return this.page.locator('#menu');
  }
  get homeLink(): Locator {
    return this.menu.locator('a', { hasText: 'Home' });
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }
}
