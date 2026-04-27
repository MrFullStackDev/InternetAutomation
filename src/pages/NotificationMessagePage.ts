import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class NotificationMessagePage extends BasePage {
  readonly path = '/notification_message_rendered';

  get clickHereLink(): Locator {
    return this.page.locator('a', { hasText: 'Click here' });
  }
  get flash(): Locator {
    return this.page.locator('#flash');
  }

  async clickAndGetMessage(): Promise<string> {
    await this.clickHereLink.click();
    return (await this.flash.innerText()).trim();
  }
}
