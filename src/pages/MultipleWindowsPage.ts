import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class MultipleWindowsPage extends BasePage {
  readonly path = '/windows';

  get clickHereLink(): Locator {
    return this.page.locator('a', { hasText: 'Click Here' });
  }

  async openNewWindow(): Promise<Page> {
    const context = this.page.context();
    const [popup] = await Promise.all([context.waitForEvent('page'), this.clickHereLink.click()]);
    await popup.waitForLoadState('domcontentloaded');
    return popup;
  }
}
