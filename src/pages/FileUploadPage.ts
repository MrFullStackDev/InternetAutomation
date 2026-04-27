import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class FileUploadPage extends BasePage {
  readonly path = '/upload';

  get fileInput(): Locator {
    return this.page.locator('#file-upload');
  }
  get submitButton(): Locator {
    return this.page.locator('#file-submit');
  }
  get uploadedFiles(): Locator {
    return this.page.locator('#uploaded-files');
  }
  get dropArea(): Locator {
    return this.page.locator('#drag-drop-upload');
  }

  async upload(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
    await this.submitButton.click();
  }

  async uploadedFileName(): Promise<string> {
    return (await this.uploadedFiles.innerText()).trim();
  }
}
