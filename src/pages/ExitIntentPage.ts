import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ExitIntentPage extends BasePage {
  readonly path = '/exit_intent';

  get modal(): Locator {
    return this.page.locator('#ouibounce-modal');
  }
  get closeButton(): Locator {
    return this.modal.locator('.modal-footer p');
  }

  // ouibounce listens for `mouseleave` on the document element. A real "exit" is
  // hard to fake from inside the viewport, so dispatch the event directly.
  async triggerExitIntent(): Promise<void> {
    await this.page.evaluate(() => {
      document.documentElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    });
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }
}
