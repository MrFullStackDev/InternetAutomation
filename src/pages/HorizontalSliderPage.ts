import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class HorizontalSliderPage extends BasePage {
  readonly path = '/horizontal_slider';

  get slider(): Locator {
    return this.page.locator('input[type="range"]');
  }
  get valueDisplay(): Locator {
    return this.page.locator('#range');
  }

  async setValue(value: number): Promise<void> {
    await this.slider.focus();
    const current = Number(await this.slider.inputValue());
    const steps = Math.round((value - current) * 2);
    const key = steps >= 0 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < Math.abs(steps); i++) {
      await this.page.keyboard.press(key);
    }
  }

  async displayedValue(): Promise<string> {
    return (await this.valueDisplay.innerText()).trim();
  }
}
