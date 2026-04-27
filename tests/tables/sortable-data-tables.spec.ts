import { test, expect } from '../../src/fixtures/pageFixtures.js';

test.describe('Sortable Data Tables', () => {
  test('table1 has four rows and the expected last names @smoke', async ({
    sortableDataTablesPage,
  }) => {
    await sortableDataTablesPage.goto();
    const lastNames = await sortableDataTablesPage.columnValues('table1', 0);
    expect(lastNames).toHaveLength(4);
    expect(lastNames).toEqual(expect.arrayContaining(['Smith', 'Bach', 'Doe', 'Conway']));
  });

  // The page intentionally demonstrates a non-sortable table ("Example 1: No Class or ID
  // attributes"). Clicking the header should not change row order or break the page.
  test('clicking the Last Name header does not reorder the (non-sortable) table', async ({
    sortableDataTablesPage,
  }) => {
    await sortableDataTablesPage.goto();
    const before = await sortableDataTablesPage.columnValues('table1', 0);
    await sortableDataTablesPage.sortBy('table1', 'Last Name');
    const after = await sortableDataTablesPage.columnValues('table1', 0);
    expect(after).toEqual(before);
  });

  test('table2 has the same four customers', async ({ sortableDataTablesPage }) => {
    await sortableDataTablesPage.goto();
    const lastNames = await sortableDataTablesPage.columnValues('table2', 0);
    expect(lastNames).toEqual(expect.arrayContaining(['Smith', 'Bach', 'Doe', 'Conway']));
  });
});
