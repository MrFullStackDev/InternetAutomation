import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

type TableId = 'table1' | 'table2';

export class SortableDataTablesPage extends BasePage {
  readonly path = '/tables';

  table(id: TableId): Locator {
    return this.page.locator(`#${id}`);
  }

  // The header text lives inside <th><span>Last Name<span class="last"></span></span></th>
  // — the literal text is on the outer <th>, so match there.
  headerCell(id: TableId, headerText: string): Locator {
    return this.table(id).locator('thead th', { hasText: headerText });
  }

  async columnValues(id: TableId, columnIndex: number): Promise<string[]> {
    const cells = await this.table(id)
      .locator(`tbody tr td:nth-child(${columnIndex + 1})`)
      .allInnerTexts();
    return cells.map((c) => c.trim());
  }

  async sortBy(id: TableId, headerText: string): Promise<void> {
    await this.headerCell(id, headerText).click();
  }
}
