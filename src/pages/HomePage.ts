import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class HomePage extends BasePage {
  readonly path = '/';

  get heading_(): Locator {
    return this.page.locator('h1.heading');
  }

  get challengeLinks(): Locator {
    return this.page.locator('ul li a');
  }

  async listChallenges(): Promise<string[]> {
    return this.challengeLinks.allInnerTexts();
  }

  async openChallenge(name: string): Promise<void> {
    await this.challengeLinks.filter({ hasText: name }).first().click();
  }
}
