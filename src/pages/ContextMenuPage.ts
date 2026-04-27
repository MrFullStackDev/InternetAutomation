import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ContextMenuPage extends BasePage {
  readonly path = '/context_menu';

  get hotspot(): Locator {
    return this.page.locator('#hot-spot');
  }

  async openContextMenu(): Promise<string> {
    let message = '';
    this.page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.accept();
    });
    await this.hotspot.click({ button: 'right' });
    return message;
  }
}
