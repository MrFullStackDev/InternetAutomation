import type { FrameLocator, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class WysiwygEditorPage extends BasePage {
  readonly path = '/tinymce';

  get editorFrame(): FrameLocator {
    return this.page.frameLocator('iframe');
  }

  get editorBody(): Locator {
    return this.editorFrame.locator('#tinymce');
  }

  get boldButton(): Locator {
    return this.page.locator('button[title="Bold"]');
  }

  async clear(): Promise<void> {
    await this.editorBody.click();
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Delete');
  }

  async type(text: string): Promise<void> {
    await this.editorBody.click();
    await this.page.keyboard.type(text);
  }
}
