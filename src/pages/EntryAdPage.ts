import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class EntryAdPage extends BasePage {
  readonly path = '/entry_ad';

  get modal(): Locator {
    return this.page.locator('.modal');
  }
  get modalTitle(): Locator {
    return this.modal.locator('.modal-title');
  }
  get closeButton(): Locator {
    return this.modal.locator('.modal-footer p');
  }
  get reEnableLink(): Locator {
    return this.page.locator('a#restart-ad');
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }

  async reEnable(): Promise<void> {
    await this.reEnableLink.click();
  }
}
