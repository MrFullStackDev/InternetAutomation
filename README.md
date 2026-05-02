# Playwright Regression Suite + Test Observability Dashboard

End-to-end regression suite for [the-internet.herokuapp.com](https://the-internet.herokuapp.com),
written in **TypeScript + Playwright** with a **Page Object Model** layout, a
**custom Playwright reporter** that streams every result into SQLite, and a
**built-in observability dashboard** (Express + vanilla JS + Chart.js) that
exports as a static site for free hosting on GitHub Pages.

> **Live dashboard:** https://mrfullstackdev.github.io/InternetAutomation/

---

## At a glance

|   |   |
|---|---|
| **Tests** | 73 across 40 spec files — auth, frames, alerts, dynamic loading, file upload/download, drag-and-drop, shadow DOM, status codes, tables, geolocation, … |
| **Browsers** | Chromium, Firefox, WebKit, Mobile Chrome (Pixel 7) |
| **CI** | GitHub Actions, 4-shard parallel matrix on every PR; full cross-browser smoke on `main` |
| **Tag taxonomy** | `@smoke` (23) · `@critical` · `@regression` · `@flaky` · `@slow` |
| **Run time** | 1.5 min full suite · 37 s smoke (single shard, single browser) |
| **Reporter** | Custom `DashboardReporter` writes runs + tests to SQLite (WAL, batched transactions) |
| **Dashboard** | Six views — Dashboard / Runs / Tests / Features / Coverage / Triage |
| **Tooling** | TypeScript strict, ESLint + Prettier + Husky pre-commit (lint + typecheck) |

## What this project demonstrates

- **Test architecture** — strict Page Object Model, lazy fixture factory, web-first
  assertions throughout, zero `waitForTimeout` calls.
- **CI engineering** — sharded parallel runs, PR gating, artifact upload (traces /
  videos / report) on failure, separate cross-browser smoke lane.
- **Observability** — custom Playwright reporter, batched SQLite writes,
  Express API, dual live + static-export dashboard with the same UI for both modes.
- **Dev ergonomics** — tag taxonomy for selective runs, `test.step()` for
  trace-viewer readability, `storageState` pattern for shared auth, dotenv,
  pre-commit typecheck.

---

## Quick start

```bash
# Node 20+ recommended
npm install
npx playwright install chromium

npm test                    # full suite, chromium
npm run test:smoke          # @smoke subset (~37 s)
npm run test:ui             # Playwright UI mode
npm run dashboard           # local observability dashboard at :4000
```

Every `npm test` invocation appends a row to `dashboard/data/results.db`. The
dashboard reads from that same database — no second build step.

---

## Tech stack

**Test runner:** Playwright 1.49 (TypeScript, ESM)
**Reporter pipeline:** custom reporter → `better-sqlite3` (WAL mode) → Express → vanilla JS + Chart.js
**Static export:** `npm run build:static` produces a fully static `dashboard-dist/` (~200 KB) consumed by GitHub Pages
**CI:** GitHub Actions, sharded matrix, browser caching, artifact upload
**Quality:** `tsc --noEmit`, `eslint-plugin-playwright`, Prettier, Husky + lint-staged

---

## Available scripts

| Script | What it does |
| --- | --- |
| `npm test` | Run the full suite (Chromium project) |
| `npm run test:smoke` | Only the `@smoke`-tagged subset |
| `npm run test:headed` | Run with the browser visible |
| `npm run test:debug` | Run with `PWDEBUG=1` (Playwright Inspector) |
| `npm run test:ui` | Playwright's interactive UI mode |
| `npm run report` | Open the static HTML report from the last run |
| `npm run dashboard` | Start the live dashboard on port 4000 |
| `npm run dashboard:dev` | Same, but auto-reloads on server-code changes |
| `npm run build:static` | Export `dashboard-dist/` for static hosting |
| `npm run preview:static` | Serve `dashboard-dist/` locally |
| `npm run lint` / `npm run lint:fix` | ESLint with `eslint-plugin-playwright` |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` over the whole repo |

A husky `pre-commit` hook runs `lint-staged` and then `tsc --noEmit`.

---

## Project layout

```
.
├── playwright.config.ts            # 4 browser projects + setup project + chromium-auth lane
├── tsconfig.json                   # strict TS, ESM
│
├── src/
│   ├── pages/                      # Page Objects (one per challenge, all extend BasePage)
│   ├── fixtures/pageFixtures.ts    # factory `make<T>(Klass)` — extends test with all POs
│   └── utils/                      # config (env-driven), paths
│
├── tests/                          # specs, organised by feature area
│   ├── auth/auth.setup.ts          # storageState: logs in once, saves session
│   ├── auth/                       # form-auth, basic-auth, digest-auth, forgot-password
│   ├── elements/ dynamic/ frames/ windows/ files/ interactions/ alerts/ tables/ misc/
│   └── home.spec.ts
│
├── reporters/DashboardReporter.ts  # custom reporter → SQLite (batched transactions)
│
├── dashboard/
│   ├── server/                     # Express API (index, db, routes, coverage)
│   └── public/                     # SPA shell + vanilla JS app
│
├── scripts/
│   ├── export-dashboard.ts         # build static dashboard from results.db
│   └── merge-dashboard-shards.ts   # combine per-shard SQLite DBs in CI
│
└── .github/workflows/dashboard.yml # 4-shard chromium matrix + cross-browser smoke + Pages deploy
```

---

## Page Object Model conventions

```ts
import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  readonly path = '/login';

  get usernameInput(): Locator { return this.page.getByLabel('Username'); }
  get passwordInput(): Locator { return this.page.getByLabel('Password'); }
  get submitButton(): Locator { return this.page.getByRole('button', { name: /login/i }); }
  get flashMessage(): Locator { return this.page.locator('#flash'); }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

- **`path`** is the relative URL (used by `BasePage.goto()`).
- **Locators** are exposed as `get`-properties so callers can use them with
  web-first `await expect(locator).toContainText(...)` — the assertion auto-retries.
- **Action methods** are async and never assert.
- **No assertions in page objects** — assertions belong in specs so failure
  messages point to the test, not the helper.
- **Accessibility-first locators** (`getByRole`, `getByLabel`) are preferred
  over CSS where the page exposes them.

### Test fixtures

[`src/fixtures/pageFixtures.ts`](src/fixtures/pageFixtures.ts) extends Playwright's
`test` so every spec can request page objects directly. A `make<T>(Klass)`
helper eliminates per-fixture boilerplate:

```ts
const make = <T>(Klass: new (page: Page) => T) =>
  async ({ page }, use) => use(new Klass(page));

export const test = base.extend<PageFixtures>({
  loginPage: make(LoginPage),
  // ...46 more
});
```

```ts
import { test, expect } from '../../src/fixtures/pageFixtures.js';

test('logs in with valid credentials @smoke @critical', async ({ loginPage, page }) => {
  await test.step('navigate to login', async () => {
    await loginPage.goto();
  });
  await test.step('submit credentials', async () => {
    await loginPage.login(config.formAuth.username, config.formAuth.password);
  });
  await test.step('verify secure area', async () => {
    await expect(page).toHaveURL(/\/secure$/);
    await expect(loginPage.secureAreaHeading).toBeVisible();
    await expect(loginPage.flashMessage).toContainText('You logged into a secure area!');
  });
});
```

### Tag taxonomy

| Tag | When to use |
| --- | --- |
| `@smoke` | Fast, must-pass subset for PR gating (~30 s in smoke run) |
| `@critical` | Auth/login/checkout-class flows that block release if broken |
| `@regression` | The full deep sweep (default tag for new tests) |
| `@flaky` | Known-unstable; quarantined but kept around for the dashboard |
| `@slow` | >10 s — excluded from PR runs to keep them fast |

Run any subset with `--grep @smoke`, etc.

### Auth state reuse

[`tests/auth/auth.setup.ts`](tests/auth/auth.setup.ts) logs in once and saves
the session to `.auth/form-auth.json`. The `chromium-auth` project depends on
this setup and applies the saved `storageState` to every spec it runs (currently
gated by `@auth`-tagged tests; pattern reference until the suite needs it).

---

## CI strategy

[`.github/workflows/dashboard.yml`](.github/workflows/dashboard.yml):

```
PR opened or updated  ──▶  test-chromium (4 shards in parallel) ─┐
                                                                  ├──▶  status check gates merge
push to main          ──▶  test-chromium (4 shards in parallel) ─┘
                      ──▶  test-cross-browser (firefox · webkit · mobile-chrome smoke)
                      ──▶  build (merge shard DBs + static export) ──▶ deploy to GitHub Pages
```

Each shard uploads three artifacts:
- `playwright-report-<project>-<shard>` — HTML report (always)
- `test-results-<project>-<shard>` — traces + videos + screenshots (on failure only)
- `dashboard-data-<project>-<shard>` — per-shard SQLite DB

The build job downloads every shard's DB, merges them with
[`scripts/merge-dashboard-shards.ts`](scripts/merge-dashboard-shards.ts) into a
single logical run grouped by commit SHA, then exports the static dashboard.

---

## The Test Observability Dashboard

### Pipeline

```
playwright test
   │
   ▼
DashboardReporter (reporters/DashboardReporter.ts)
   • onBegin   → INSERT INTO runs(...)
   • onTestEnd → buffer; flush every 50 tests in a transaction
   • onEnd     → final flush + UPDATE runs SET passed/failed/skipped/duration_ms ...
   │
   ▼
SQLite (dashboard/data/results.db, WAL mode)
   │
   ├──▶  Express API (dashboard/server) ──▶ public/ (live mode)
   │
   └──▶  scripts/export-dashboard.ts ──▶ dashboard-dist/data/*.json (static mode)
```

### Schema

```sql
runs(
  id, started_at, finished_at, project, branch, commit_sha, status,
  total, passed, failed, skipped, flaky, duration_ms
)
tests(
  id, run_id (FK→runs), suite, title, full_title, file, project, status,
  duration_ms, retries, error_message, error_stack, attachments_json, tags_json
)
```

Both reporter and server bootstrap the schema with `CREATE TABLE IF NOT EXISTS`
— no migration step.

### Views

| View | Source |
| --- | --- |
| **Dashboard** | KPI cards + 4 trend charts (`/api/summary`, `/api/trends`, `/api/by-suite`) |
| **Runs** | Per-run history; click into any run for its full test list |
| **Tests** | Aggregated unique tests with latest status; searchable, filterable, sortable |
| **Features** | Per-spec-file cards with pass-rate %, dot grid, bug-tag count; tabs for Healthy / Needs Attention |
| **Coverage** | Static analysis of `tests/` (spec files, describe blocks, test cases, bug tags) reconciled with runtime counts to handle parameterized tests |
| **Triage** | Failed + flaky tests with error messages and links to traces / screenshots |

### Live vs static modes

The frontend probes `GET /api/health` at boot:

- **Live:** full UI, time-range filter, Reset / Refresh buttons
- **Static:** reads `./data/*.json`, hides admin controls, shows a "Static
  snapshot · &lt;build time&gt;" badge — same components, same charts

```bash
npm test                # populate dashboard/data/results.db
npm run build:static    # → dashboard-dist/  (~200 KB)
npm run preview:static  # serves it on http://localhost:3000
```

Upload `dashboard-dist/` to any static host (GitHub Pages, Cloudflare Pages,
Netlify, S3 / R2). The included GitHub Actions workflow does this automatically.

---

## REST API reference

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/summary` | Totals across all runs + latest run summary |
| GET | `/api/runs?limit=&days=` | Most recent runs |
| GET | `/api/runs/latest` | Most recent single run |
| GET | `/api/runs/:id` | Single run + every test record |
| GET | `/api/runs-summary?days=` | Total / healthy / needs-attention buckets |
| GET | `/api/trends?limit=&days=` | Time-ordered points for trend charts |
| GET | `/api/by-suite?runId=` | Per-suite roll-up for a single run |
| GET | `/api/coverage?refresh=1` | Static analysis report (cached 30 s) |
| GET | `/api/coverage/files` | Just the `byFile` array |
| GET | `/api/features?days=` | Per-spec-file rollup |
| GET | `/api/tests-aggregated?days=` | All unique tests, latest status per `fullTitle` |
| GET | `/api/triage?days=` | Failed + flaky tests for the Triage view |
| GET | `/api/tests/:id` | Single test record |
| DELETE | `/api/runs` | Wipe all run + test history |
| GET | `/artifacts/<relative-path>` | Serve a trace.zip / screenshot / video |

---

## Configuration

| Variable | Default | Used by |
| --- | --- | --- |
| `BASE_URL` | `https://the-internet.herokuapp.com` | Playwright `use.baseURL` |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` | `admin` / `admin` | basic-auth + secure-download |
| `FORM_AUTH_USER` / `FORM_AUTH_PASS` | `tomsmith` / `SuperSecretPassword!` | form-auth |
| `DASHBOARD_PORT` | `4000` | Express server |
| `DASHBOARD_DB_PATH` | `dashboard/data/results.db` | reporter + server |
| `GIT_BRANCH`, `GIT_COMMIT` | unset | recorded into `runs.branch` / `runs.commit_sha` |
| `CI` | unset | enables `forbidOnly`, retries=2, workers=4, GitHub reporter |

`.env` is loaded automatically via `dotenv` at config time.
[`src/utils/config.ts`](src/utils/config.ts) is the single source of truth for
env-derived defaults.

---

## Known live-site quirks

The-internet.herokuapp.com encodes a few real bugs and intentional rough edges
that the suite documents:

- **TinyMCE iframe (`/iframe`, `/tinymce`)** — runs in `mce-content-readonly`
  with a license-upgrade overlay. Specs verify the iframe + Bold button render
  rather than typing.
- **Sortable Data Tables (`/tables`)** — the table is *intentionally
  non-sortable* ("Example 1: No Class or ID attributes"). The spec asserts
  clicking the header does **not** reorder rows.
- **Digest auth (`/digest_auth`)** — Chromium does not always negotiate digest
  successfully; tagged `@flaky` and accepts either 200 or 401.
- **Forgot password (`/forgot_password`)** — the live Sinatra app sometimes
  500s; the spec only asserts the form submission attempt.
- **JS dialogs** — `page.once('dialog', ...)` must be registered *before* the
  click. Using `waitForEvent('dialog')` followed by an awaited click deadlocks
  because the click waits for the dialog to be handled.

---

## Architecture decisions

- **Vanilla JS + Chart.js (no React/Vue)** — the dashboard is small (~1k LOC),
  has no build step, ships as one `app.js` file, and runs in any browser.
- **SQLite via `better-sqlite3`** — synchronous, embedded, prebuilt binaries on
  macOS / Linux / Windows. No daemon, no migrations, no race conditions for a
  single-writer / many-reader workload. WAL mode lets dashboard reads coexist
  with parallel-worker writes.
- **Batched reporter inserts** — the reporter buffers test results and flushes
  every 50 tests inside a transaction. One `fsync` per batch instead of per
  test; matters at suite sizes well past this project's current 73.
- **Static-analysis "coverage"** — Playwright doesn't expose describe/test
  counts via reporter events. The dashboard server re-parses `tests/` (cached
  30 s) so the Coverage view always reflects what's currently checked in, not
  what was last executed. Runtime counts override the static count where they
  differ (parameterized tests).
- **Aggregated Tests view** — shows one row per *unique full title* across all
  runs in the time range, with the most recent status. A smoke run after a full
  run still shows the suite's full inventory rather than collapsing to 23.
- **AbortController on every fetch** — switching views aborts in-flight
  requests so stale data can never overwrite the new view.
- **Sharded CI with merged DBs** — each shard writes its own SQLite file; a
  build-time merge step combines them into one logical run grouped by commit
  SHA before the dashboard is built. Avoids the alternative of an external DB
  service for transient CI data.
- **Single-fixture factory pattern** — `make<T>(Klass)` collapses 47 lines of
  fixture boilerplate to one line per page object while keeping the
  per-test-injected `page` lazy.

---

## Troubleshooting

**`npm install` fails on `better-sqlite3`** — needs a C++ toolchain.
macOS: `xcode-select --install`. Linux: `apt install build-essential python3`.

**`npx playwright install chromium` is slow** — the binary is ~150 MB. Behind a
corporate proxy, set `HTTPS_PROXY` and `npm_config_https_proxy`.

**Dashboard says `0 runs` after running tests** — the reporter only writes when
no `--reporter=` flag is passed (CLI flags override `playwright.config.ts`).
Run plain `npm test` to populate the DB.

**Port 4000 already in use** — `DASHBOARD_PORT=4321 npm run dashboard` (or
`lsof -ti:4000 | xargs kill -9`).

**SQLite "database is locked"** — should never happen (WAL, single writer).
If it does, stop the dashboard before running tests, or delete
`dashboard/data/results.db-wal` and `-shm`.

**`Reset All Stats` doesn't delete the file on disk** — by design. It clears
the `runs` and `tests` tables but leaves the `.db` file in place so the next
`npm test` can write to it without re-creating the schema.

---

PRs welcome — `npm run lint && npm run typecheck && npm test` before opening.
