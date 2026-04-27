import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(here, '..', '..');
export const FIXTURES_DIR = path.join(ROOT_DIR, 'test-fixtures');
export const DOWNLOADS_DIR = path.join(FIXTURES_DIR, 'downloads');

export function fixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}
