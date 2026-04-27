import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Context Menu', () => {
  test('right-click on hotspot triggers a JS alert @smoke', async ({ contextMenuPage }) => {
    await contextMenuPage.goto();
    const message = await contextMenuPage.openContextMenu();
    expect(message).toContain('You selected a context menu');
  });
});
