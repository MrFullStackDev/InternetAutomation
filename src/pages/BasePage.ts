import type { Locator, Page, Response } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;
  abstract readonly path: string;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<Response | null> {
    return this.page.goto(this.path);
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  get footer(): Locator {
    return this.page.locator('#page-footer');
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }
}
