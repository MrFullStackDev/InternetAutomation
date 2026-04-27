import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AddRemoveElementsPage extends BasePage {
  readonly path = '/add_remove_elements/';

  get addButton(): Locator {
    return this.page.locator('button', { hasText: 'Add Element' });
  }
  get deleteButtons(): Locator {
    return this.page.locator('button.added-manually');
  }

  async addElements(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.addButton.click();
    }
  }

  async deleteElementAt(index: number): Promise<void> {
    await this.deleteButtons.nth(index).click();
  }

  async deleteElementCount(): Promise<number> {
    return this.deleteButtons.count();
  }
}
