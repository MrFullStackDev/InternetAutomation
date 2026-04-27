import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LargeAndDeepDomPage extends BasePage {
  readonly path = '/large';

  get largeTable(): Locator {
    return this.page.locator('#large-table');
  }
  get siblingsContainer(): Locator {
    return this.page.locator('#siblings');
  }

  async tableRowCount(): Promise<number> {
    return this.largeTable.locator('tbody tr').count();
  }

  async deepNodeText(): Promise<string> {
    return (await this.page.locator('.sibling-50.5').innerText()).trim();
  }
}
