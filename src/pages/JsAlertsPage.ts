import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

type AlertKind = 'alert' | 'confirm' | 'prompt';

export class JsAlertsPage extends BasePage {
  readonly path = '/javascript_alerts';

  get jsAlertButton(): Locator {
    return this.page.locator('button', { hasText: 'Click for JS Alert' });
  }
  get jsConfirmButton(): Locator {
    return this.page.locator('button', { hasText: 'Click for JS Confirm' });
  }
  get jsPromptButton(): Locator {
    return this.page.locator('button', { hasText: 'Click for JS Prompt' });
  }
  get result(): Locator {
    return this.page.locator('#result');
  }

  async trigger(
    kind: AlertKind,
    options?: { accept?: boolean; promptText?: string },
  ): Promise<string> {
    const accept = options?.accept ?? true;
    const button =
      kind === 'alert'
        ? this.jsAlertButton
        : kind === 'confirm'
          ? this.jsConfirmButton
          : this.jsPromptButton;

    let captured = '';
    // Native window.alert/confirm/prompt blocks until handled. Use a pre-registered
    // handler so the click resolves cleanly.
    this.page.once('dialog', async (dialog) => {
      captured = dialog.message();
      if (accept) await dialog.accept(options?.promptText);
      else await dialog.dismiss();
    });
    await button.click();
    return captured;
  }

  async resultText(): Promise<string> {
    return (await this.result.innerText()).trim();
  }
}
