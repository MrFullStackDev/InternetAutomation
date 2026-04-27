import type { Download, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class FileDownloadPage extends BasePage {
  readonly path = '/download';

  get downloadLinks(): Locator {
    return this.page.locator('div.example a');
  }

  async availableFiles(): Promise<string[]> {
    return this.downloadLinks.allInnerTexts();
  }

  async downloadFirst(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadLinks.first().click(),
    ]);
    return download;
  }
}
