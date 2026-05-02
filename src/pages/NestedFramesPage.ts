import type { FrameLocator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class NestedFramesPage extends BasePage {
  readonly path = '/nested_frames';

  get topFrame(): FrameLocator {
    return this.page.frameLocator('frame[name="frame-top"]');
  }
  get leftFrame(): FrameLocator {
    return this.topFrame.frameLocator('frame[name="frame-left"]');
  }
  get middleFrame(): FrameLocator {
    return this.topFrame.frameLocator('frame[name="frame-middle"]');
  }
  get rightFrame(): FrameLocator {
    return this.topFrame.frameLocator('frame[name="frame-right"]');
  }
  get bottomFrame(): FrameLocator {
    return this.page.frameLocator('frame[name="frame-bottom"]');
  }
}
