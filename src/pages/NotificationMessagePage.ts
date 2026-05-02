import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class NotificationMessagePage extends BasePage {
  readonly path = '/notification_message_rendered';

  get clickHereLink(): Locator {
    return this.page.getByRole('link', { name: /click here/i });
  }
  get flash(): Locator {
    return this.page.locator('#flash');
  }

  async triggerNotification(): Promise<void> {
    await this.clickHereLink.click();
  }
}
