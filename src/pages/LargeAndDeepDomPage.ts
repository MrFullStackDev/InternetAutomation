import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LargeAndDeepDomPage extends BasePage {
  readonly path = '/large';

  get largeTable(): Locator {
    return this.page.locator('#large-table');
  }
  get tableRows(): Locator {
    return this.largeTable.locator('tbody tr');
  }
  get siblingsContainer(): Locator {
    return this.page.locator('#siblings');
  }
  get deepNode(): Locator {
    return this.page.locator('.sibling-50.5');
  }
}
