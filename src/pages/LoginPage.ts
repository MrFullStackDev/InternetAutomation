import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  readonly path = '/login';

  get usernameInput(): Locator {
    return this.page.getByLabel('Username');
  }
  get passwordInput(): Locator {
    return this.page.getByLabel('Password');
  }
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /login/i });
  }
  get flashMessage(): Locator {
    return this.page.locator('#flash');
  }
  get logoutButton(): Locator {
    return this.page.getByRole('link', { name: /logout/i });
  }
  get secureAreaHeading(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Secure Area' });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
