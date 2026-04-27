import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class DynamicControlsPage extends BasePage {
  readonly path = '/dynamic_controls';

  // The form that wraps the checkbox is removed and re-added; scope on the outer
  // example div which is stable.
  get checkbox(): Locator {
    return this.page.locator('#checkbox-example input[type="checkbox"]');
  }
  get checkboxToggleButton(): Locator {
    return this.page.locator('#checkbox-example button');
  }
  get textInput(): Locator {
    return this.page.locator('#input-example input[type="text"]');
  }
  get textInputToggleButton(): Locator {
    return this.page.locator('#input-example button');
  }
  get message(): Locator {
    return this.page.locator('#message');
  }

  async toggleCheckbox(): Promise<void> {
    await this.checkboxToggleButton.click();
  }

  async toggleTextInput(): Promise<void> {
    await this.textInputToggleButton.click();
  }
}
