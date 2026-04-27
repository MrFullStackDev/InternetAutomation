import { BasePage } from './BasePage.js';

export class NestedFramesPage extends BasePage {
  readonly path = '/nested_frames';

  async leftFrameText(): Promise<string> {
    const top = this.page.frame({ name: 'frame-top' });
    const left = top?.childFrames().find((f) => f.name() === 'frame-left');
    return ((await left?.locator('body').textContent()) ?? '').trim();
  }

  async middleFrameText(): Promise<string> {
    const top = this.page.frame({ name: 'frame-top' });
    const middle = top?.childFrames().find((f) => f.name() === 'frame-middle');
    return ((await middle?.locator('#content').textContent()) ?? '').trim();
  }

  async rightFrameText(): Promise<string> {
    const top = this.page.frame({ name: 'frame-top' });
    const right = top?.childFrames().find((f) => f.name() === 'frame-right');
    return ((await right?.locator('body').textContent()) ?? '').trim();
  }

  async bottomFrameText(): Promise<string> {
    const bottom = this.page.frame({ name: 'frame-bottom' });
    return ((await bottom?.locator('body').textContent()) ?? '').trim();
  }
}
