import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  readonly path = '/login';

  get usernameInput(): Locator {
    return this.page.locator('#username');
  }
  get passwordInput(): Locator {
    return this.page.locator('#password');
  }
  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }
  get flashMessage(): Locator {
    return this.page.locator('#flash');
  }
  get logoutButton(): Locator {
    return this.page.locator('a[href="/logout"]');
  }
  get secureAreaHeading(): Locator {
    return this.page.locator('h2', { hasText: 'Secure Area' });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async flashText(): Promise<string> {
    return (await this.flashMessage.innerText()).trim();
  }
}
