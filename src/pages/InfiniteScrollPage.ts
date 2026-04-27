import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class InfiniteScrollPage extends BasePage {
  readonly path = '/infinite_scroll';

  get paragraphs(): Locator {
    return this.page.locator('.jscroll-added');
  }

  async paragraphCount(): Promise<number> {
    return this.paragraphs.count();
  }

  // jscroll fires when the user scrolls the wheel near the bottom; window.scrollTo
  // alone is not always enough. Use mouse wheel for a more realistic gesture.
  async scrollOnce(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.mouse.wheel(0, 600);
  }

  async scrollUntilCount(target: number, maxScrolls = 15): Promise<number> {
    let count = await this.paragraphCount();
    for (let i = 0; i < maxScrolls && count < target; i++) {
      await this.scrollOnce();
      try {
        await this.page.waitForFunction(
          (prev) => document.querySelectorAll('.jscroll-added').length > prev,
          count,
          { timeout: 4000 },
        );
      } catch {
        // Try another wheel; the load may not have triggered yet.
      }
      count = await this.paragraphCount();
    }
    return count;
  }
}
