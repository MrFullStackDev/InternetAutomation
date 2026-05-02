import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class DragAndDropPage extends BasePage {
  readonly path = '/drag_and_drop';

  get columnA(): Locator {
    return this.page.locator('#column-a');
  }
  get columnB(): Locator {
    return this.page.locator('#column-b');
  }

  headerOf(column: 'a' | 'b'): Locator {
    return (column === 'a' ? this.columnA : this.columnB).locator('header');
  }

  async dragAToB(): Promise<void> {
    // Native dragTo can be unreliable for HTML5 DnD on this page; do a manual sequence.
    const aBox = await this.columnA.boundingBox();
    const bBox = await this.columnB.boundingBox();
    if (!aBox || !bBox) throw new Error('Could not measure column bounding boxes');
    await this.page.mouse.move(aBox.x + aBox.width / 2, aBox.y + aBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(bBox.x + bBox.width / 2, bBox.y + bBox.height / 2, { steps: 10 });
    await this.page.mouse.move(bBox.x + bBox.width / 2, bBox.y + bBox.height / 2);
    await this.page.mouse.up();
  }
}
