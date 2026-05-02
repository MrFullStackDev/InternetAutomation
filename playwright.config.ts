import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

import 'dotenv/config';

const BASE_URL = process.env.BASE_URL ?? 'https://the-internet.herokuapp.com';

const isCI = !!process.env.CI;
const STORAGE_STATE = path.join('.auth', 'form-auth.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['./reporters/DashboardReporter.ts'],
    ...(isCI ? ([['github']] as const) : []),
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    // Runs `tests/**/*.setup.ts` to prepare shared state (e.g. saved auth).
    // Only depended on by projects that need it; most browser projects don't.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: /.*\.setup\.ts/,
    },
    // Authenticated lane — run with `--project=chromium-auth` for tests that
    // need a logged-in session reused across cases (currently a pattern stub).
    {
      name: 'chromium-auth',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
      grep: /@auth/,
    },
  ],
  outputDir: 'test-results',
});
