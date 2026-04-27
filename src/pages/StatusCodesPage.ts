import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

type StatusCode = 200 | 301 | 404 | 500;

export class StatusCodesPage extends BasePage {
  readonly path = '/status_codes';

  static codePath(code: StatusCode): string {
    return `/status_codes/${code}`;
  }

  get codeLinks(): Locator {
    return this.page.locator('div.example ul li a');
  }

  get message(): Locator {
    return this.page.locator('div.example p');
  }

  async clickCode(code: StatusCode): Promise<void> {
    await this.codeLinks.filter({ hasText: String(code) }).first().click();
  }
}
