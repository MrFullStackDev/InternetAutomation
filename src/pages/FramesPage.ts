import type { FrameLocator, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class FramesPage extends BasePage {
  readonly path = '/frames';

  get nestedFramesLink(): Locator {
    return this.page.locator('a', { hasText: 'Nested Frames' });
  }
  get iframeLink(): Locator {
    return this.page.locator('a', { hasText: 'iFrame' });
  }
}

export class IFramePage extends BasePage {
  readonly path = '/iframe';

  get editorFrame(): FrameLocator {
    return this.page.frameLocator('#mce_0_ifr');
  }

  get editorBody(): Locator {
    return this.editorFrame.locator('#tinymce');
  }

  async clearText(): Promise<void> {
    await this.editorBody.click();
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Delete');
  }

  async typeText(text: string): Promise<void> {
    await this.editorBody.click();
    await this.page.keyboard.type(text);
  }

  async editorText(): Promise<string> {
    return (await this.editorBody.innerText()).trim();
  }
}
