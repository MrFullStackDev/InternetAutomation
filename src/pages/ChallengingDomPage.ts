import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ChallengingDomPage extends BasePage {
  readonly path = '/challenging_dom';

  get blueButton(): Locator {
    return this.page.locator('a.button').first();
  }
  get redButton(): Locator {
    return this.page.locator('a.button.alert');
  }
  get greenButton(): Locator {
    return this.page.locator('a.button.success');
  }
  get canvas(): Locator {
    return this.page.locator('#canvas');
  }
  get table(): Locator {
    return this.page.locator('table');
  }

  async clickBlue(): Promise<void> {
    await this.blueButton.click();
  }
}
