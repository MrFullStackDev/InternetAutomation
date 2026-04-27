import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class DisappearingElementsPage extends BasePage {
  readonly path = '/disappearing_elements';

  get menuItems(): Locator {
    return this.page.locator('ul li a');
  }

  async menuItemNames(): Promise<string[]> {
    return this.menuItems.allInnerTexts();
  }

  async itemCount(): Promise<number> {
    return this.menuItems.count();
  }
}
