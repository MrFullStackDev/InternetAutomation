import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ForgotPasswordPage extends BasePage {
  readonly path = '/forgot_password';

  get emailInput(): Locator {
    return this.page.locator('#email');
  }
  get submitButton(): Locator {
    return this.page.locator('#form_submit');
  }
  get content(): Locator {
    return this.page.locator('#content');
  }

  async submitEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
