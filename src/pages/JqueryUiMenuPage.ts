import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class JqueryUiMenuPage extends BasePage {
  readonly path = '/jqueryui/menu';

  get menu(): Locator {
    return this.page.locator('#menu');
  }
  get enabledItem(): Locator {
    return this.page.locator('#ui-id-3');
  }
  get downloadsItem(): Locator {
    return this.page.locator('#ui-id-4');
  }
  get pdfDownload(): Locator {
    return this.page.locator('#ui-id-7');
  }

  async hoverEnabled(): Promise<void> {
    await this.enabledItem.hover();
  }

  async hoverDownloads(): Promise<void> {
    await this.downloadsItem.hover();
  }
}
