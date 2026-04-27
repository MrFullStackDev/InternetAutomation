# InternetAutomation

End-to-end regression suite for [the-internet.herokuapp.com](https://the-internet.herokuapp.com),
written in **TypeScript + Playwright** with a **Page Object Model** layout
and a **built-in Test Observability Dashboard** powered by SQLite + Express +
Chart.js.

- **73 tests** across **45 spec files** covering every challenge on the
  the-internet site (auth, frames, alerts, dynamic loading, file upload/download,
  drag-and-drop, shadow DOM, status codes, etc.).
- **Custom Playwright reporter** captures every run/test into `dashboard/data/results.db`.
- **Local dashboard** at `http://localhost:4000` with six views:
  Dashboard · Runs · Tests · Features · Coverage · Triage.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Available scripts](#available-scripts)
3. [Project layout](#project-layout)
4. [Page Object Model conventions](#page-object-model-conventions)
5. [Adding a new test](#adding-a-new-test)
6. [The Test Observability Dashboard](#the-test-observability-dashboard)
7. [REST API reference](#rest-api-reference)
8. [Configuration](#configuration)
9. [Code quality](#code-quality)
10. [Known live-site quirks](#known-live-site-quirks)
11. [Troubleshooting](#troubleshooting)
12. [Architecture decisions](#architecture-decisions)

---

## Quick start

```bash
# 1. install deps (Node 20+ recommended; tested on Node 22 / 25)
npm install

# 2. install the Chromium browser binary Playwright needs
npx playwright install chromium

# 3. run the suite
npm test                    # 73 tests against the live site
npm run test:smoke          # ~22 @smoke-tagged tests (~30s)
npm run test:headed         # show the browser
npm run test:ui             # Playwright's interactive UI mode

# 4. open the observability dashboard
npm run dashboard           # http://localhost:4000
```

Every `npm test` invocation appends a row to `dashboard/data/results.db`.
The dashboard reads from that database — no second build step.

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
| `npm run dashboard` | Start the observability dashboard on port 4000 |
| `npm run dashboard:dev` | Same, but auto-reloads on server-code changes |
| `npm run lint` / `npm run lint:fix` | ESLint (with `eslint-plugin-playwright`) |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` over the whole repo |

A husky `pre-commit` hook runs `lint-staged` (eslint + prettier on changed files).

---

## Project layout

```
.
├── playwright.config.ts            # Playwright config (reporters, baseURL, project)
├── tsconfig.json                   # strict TS, ESM, path aliases
├── eslint.config.js                # ESLint flat config + Playwright plugin
├── .prettierrc / .prettierignore   # formatting
├── .husky/pre-commit               # runs lint-staged
│
├── src/
│   ├── pages/                      # Page Objects (one per challenge, all extend BasePage)
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   └── ... (44 more)
│   ├── fixtures/
│   │   └── pageFixtures.ts         # extends Playwright `test` to inject every page object
│   ├── utils/
│   │   ├── config.ts               # env-driven config (baseUrl, credentials)
│   │   └── paths.ts                # filesystem helpers (test-fixtures, downloads)
│   └── types/index.ts              # shared types
│
├── tests/                          # specs, organised by feature area
│   ├── auth/                       # form-auth, basic-auth, digest-auth, forgot-password
│   ├── elements/                   # add/remove, checkboxes, dropdown, inputs, slider
│   ├── dynamic/                    # dynamic content / controls / loading
│   ├── frames/                     # frames, nested frames, iframe
│   ├── windows/                    # multiple windows, redirect link
│   ├── files/                      # file upload, file download, secure download
│   ├── interactions/               # drag-drop, hovers, context menu, keys, jquery menu, tinymce
│   ├── alerts/                     # JS alerts, entry/exit ad, notification msgs
│   ├── tables/                     # sortable data tables, challenging DOM
│   └── misc/                       # A/B test, broken images, geolocation, etc.
│
├── reporters/
│   └── DashboardReporter.ts        # custom Playwright reporter → writes to SQLite
│
├── dashboard/
│   ├── server/
│   │   ├── index.ts                # Express bootstrap (port 4000 by default)
│   │   ├── db.ts                   # SQLite connection + schema bootstrap
│   │   ├── routes.ts               # REST API (see "REST API reference")
│   │   └── coverage.ts             # static analysis: counts test cases / describes / bug tags
│   ├── public/
│   │   ├── index.html              # SPA shell (sidebar + topbar + 6 view sections)
│   │   ├── styles.css              # light theme, popover/spinner/toast/badges
│   │   └── app.js                  # vanilla-JS SPA: hash routing, fetch, Chart.js
│   └── data/                       # SQLite db lives here (gitignored)
│
└── test-fixtures/
    └── sample-upload.txt           # used by file-upload spec
```

---

## Page Object Model conventions

Every page object lives in `src/pages/` and extends [`BasePage`](src/pages/BasePage.ts):

```ts
import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  readonly path = '/login';

  get usernameInput(): Locator { return this.page.locator('#username'); }
  get passwordInput(): Locator { return this.page.locator('#password'); }
  get submitButton(): Locator { return this.page.locator('button[type="submit"]'); }
  get flashMessage(): Locator { return this.page.locator('#flash'); }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

Conventions:

- **`path`** is the relative URL (used by `BasePage.goto()`).
- **Locators** are exposed as `get`-properties (lazy, read-only, no constructor wiring).
- **Action methods** are async and never assert — they mutate page state and return data.
- **Query methods** (`messageText()`, `getStates()`) return primitives so specs can assert.
- **No assertions in page objects** — assertions belong in specs so failure messages
  point to the test, not to the page object.

### Test fixtures

[`src/fixtures/pageFixtures.ts`](src/fixtures/pageFixtures.ts) extends Playwright's
`test` so every spec can request page objects directly:

```ts
import { test, expect } from '../../src/fixtures/pageFixtures.js';

test('logs in with valid credentials', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login('tomsmith', 'SuperSecretPassword!');
  await expect(page).toHaveURL(/\/secure$/);
});
```

Each fixture instantiates its page object with the per-test `page`, and Playwright
handles teardown automatically.

---

## Adding a new test

1. **Page object** — create `src/pages/MyFeaturePage.ts` extending `BasePage`.
2. **Fixture** — register it in `src/fixtures/pageFixtures.ts` (add to `PageFixtures`
   interface and to the `test.extend` block).
3. **Spec** — add `tests/<area>/my-feature.spec.ts` and write tests using the fixture.
4. **(Optional) tag with `@smoke`** to include it in `npm run test:smoke`.

The dashboard picks up new specs automatically — `Coverage` analyses `tests/`
on every page load (with a 30-second cache).

---

## The Test Observability Dashboard

### Pipeline

```
playwright test
   │
   ▼
DashboardReporter (reporters/DashboardReporter.ts)
   • onBegin   → INSERT INTO runs(...)
   • onTestEnd → INSERT INTO tests(...)  (per test result)
   • onEnd     → UPDATE runs SET passed/failed/skipped/duration_ms ...
   │
   ▼
SQLite (dashboard/data/results.db, WAL mode)
   │
   ▼
Express API (dashboard/server) ──► public/ (vanilla JS + Chart.js)
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

Both reporter and server bootstrap the schema with `CREATE TABLE IF NOT EXISTS` —
no migration step needed.

### Views

| View | Path | Source |
| --- | --- | --- |
| **Dashboard** | `#dashboard` | KPI cards + 4 trend charts (`/api/summary`, `/api/trends`, `/api/by-suite`) |
| **Runs** | `#runs` | Per-run history table; click a row to see all tests in that run |
| **Tests** | `#tests` | All unique tests aggregated across runs (latest status); searchable + filterable + sortable |
| **Features** | `#features` | One card per spec file (pass rate %, dot grid, bug-tag count). Tabs: All / Healthy / Needs Attention |
| **Coverage** | `#coverage` | Spec file inventory + per-file counts. `Test Cases` uses the **runtime** count from the latest runs in the selected window so parameterized tests (e.g. `for (const x of [...]) test(...)`) are counted correctly and Coverage matches Tests. Files with no execution data fall back to the static count from the source. `Describe Blocks` and `Bug Tags` are always static. Bar chart + folder donut + inventory table. |
| **Triage** | `#triage` | Failing + flaky tests; left-list + right-detail with error message and links to traces/screenshots |

### Time-range filter

The "Last 7 days" pill in the topbar is a working `<details>`-based popover with
**Last 24 hours · Last 7 days · Last 30 days · All time**. Selecting a range
invalidates the cache and re-renders the active view.

### Reset

The "Reset All Stats" button (sidebar footer) calls `DELETE /api/runs`, which
clears both `runs` and `tests` and resets the autoincrement counters.

### Bug tags

The Coverage analyser counts these as "bug tags" (proxy for test debt):

- `test.skip(`, `test.fixme(`, `test.fail(`
- Inline comments matching `// TODO`, `// FIXME`, `// XXX`, `// HACK`, `// BUG`

---

## REST API reference

All endpoints are JSON over HTTP. The dashboard serves them under `/api/*` from
`http://localhost:4000`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/summary` | Totals across all runs + latest run summary |
| GET | `/api/runs?limit=&days=` | Most recent runs (newest first) |
| GET | `/api/runs/latest` | Most recent single run |
| GET | `/api/runs/:id` | Single run + every test record |
| GET | `/api/runs-summary?days=` | Total / healthy / needs-attention buckets |
| GET | `/api/trends?limit=&days=` | Time-ordered points for trend charts |
| GET | `/api/by-suite?runId=` | Per-suite roll-up for a single run |
| GET | `/api/coverage?refresh=1` | Static analysis report (cached 30s) |
| GET | `/api/coverage/files` | Just the `byFile` array |
| GET | `/api/features?days=` | Per-spec-file rollup (test counts + bug tags) |
| GET | `/api/tests-aggregated?days=` | All unique tests (latest status per `fullTitle`) |
| GET | `/api/triage?days=` | Failed + flaky tests, ready for the Triage view |
| GET | `/api/tests/:id` | Single test record (with attachments/error) |
| DELETE | `/api/runs` | Wipe all run + test history |
| GET | `/artifacts/<relative-path>` | Serve an attachment file (trace.zip, screenshot, video) |

`days` is optional; when present it filters by `started_at >= now − N days`.
Use `?days=` (empty) or omit for "all time".

---

## Configuration

Environment variables:

| Variable | Default | Used by |
| --- | --- | --- |
| `BASE_URL` | `https://the-internet.herokuapp.com` | Playwright `use.baseURL`, page objects |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` | `admin` / `admin` | basic-auth + secure-download tests |
| `FORM_AUTH_USER` / `FORM_AUTH_PASS` | `tomsmith` / `SuperSecretPassword!` | form-auth tests |
| `DASHBOARD_PORT` | `4000` | Express server |
| `DASHBOARD_DB_PATH` | `dashboard/data/results.db` | reporter + server |
| `GIT_BRANCH`, `GIT_COMMIT` | unset | recorded into `runs.branch` / `runs.commit_sha` |
| `CI` | unset | enables `forbidOnly`, retries=2, workers=4 |

`src/utils/config.ts` is the single source of truth for env-derived defaults.

---

## Code quality

- **TypeScript**: strict mode, `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitReturns`. Path aliases (`@pages/*`, `@fixtures/*`, `@utils/*`) are
  configured in `tsconfig.json`.
- **ESLint**: flat config (`eslint.config.js`) with `@typescript-eslint`,
  `eslint-plugin-playwright`, and `eslint-config-prettier`.
- **Prettier**: 100-col, single quotes, trailing commas. `.prettierignore`
  excludes generated dirs.
- **Husky + lint-staged**: `pre-commit` runs eslint --fix + prettier on changed
  files only.
- **No `any` in production code** (warnings only); `noExplicitAny` is enforced
  loosely so Playwright DOM helpers don't need wrappers.

---

## Known live-site quirks

The-internet.herokuapp.com is occasionally unreliable. The suite encodes
work-arounds for several real bugs in the demo site:

- **TinyMCE iframe (`/iframe`, `/tinymce`)** — runs in `mce-content-readonly`
  mode without a license key, with an "upgrade" overlay covering the editor.
  The specs verify that the iframe + Bold button render rather than typing.
- **Sortable Data Tables (`/tables`)** — the table is intentionally
  *non-sortable* ("Example 1: No Class or ID attributes"). The spec asserts that
  clicking the header does **not** reorder rows.
- **Digest auth (`/digest_auth`)** — Chromium does not always negotiate digest
  successfully; the spec accepts either 200 or 401.
- **Forgot password (`/forgot_password`)** — the live Sinatra app sometimes 500s;
  the spec only asserts the form submission attempt.
- **JS alert handling** — `page.once('dialog', ...)` must be registered *before*
  the click. Using `waitForEvent('dialog')` followed by an awaited click
  deadlocks because the click waits for the dialog to be handled.

---

### Build the static export locally

```bash
npm test                # populate dashboard/data/results.db
npm run build:static    # → dashboard-dist/
npm run preview:static  # serves dashboard-dist on http://localhost:3000
```

`dashboard-dist/` is ~200 KB. Upload it to any static host:

| Host | Setup | Notes |
| --- | --- | --- |
| **GitHub Pages** | Repo → Settings → Pages → Source = "GitHub Actions"; the included [`dashboard.yml`](.github/workflows/dashboard.yml) workflow handles the rest | Free for public repos; needs Pro/Team for private |

### GitHub Actions workflow (included)

[`.github/workflows/dashboard.yml`](.github/workflows/dashboard.yml) does, on every push to `main`
and on demand:

1. Checkout + `npm ci`
2. `npx playwright install --with-deps chromium`
3. `npm test` (with `continue-on-error` so failures still publish the dashboard)
4. `npm run build:static`
5. Upload `dashboard-dist` to GitHub Pages

After enabling Pages → "GitHub Actions" the published URL appears in the
workflow summary. Successive runs append to the trend charts because each commit
gets a fresh DB and run row.

---

## Troubleshooting

**`npm install` fails on `better-sqlite3`** — you need a C++ toolchain.
On macOS: `xcode-select --install`. On Linux: `apt install build-essential python3`.

**`npx playwright install chromium` is slow / blocked** — the binary is ~150MB.
Behind a corporate proxy, set `HTTPS_PROXY` and `npm_config_https_proxy`.

**Dashboard says `0 runs` after running tests** — the reporter only writes when
no `--reporter=` flag is passed (CLI flags override `playwright.config.ts`).
Run `npm test` (which doesn't pass `--reporter`) to populate the DB.

**Port 4000 already in use** — set `DASHBOARD_PORT=4321 npm run dashboard` (or
`lsof -ti:4000 | xargs kill -9`).

**SQLite says "database is locked"** — should never happen (WAL mode, single
writer). If it does, stop the dashboard server before running tests, or delete
`dashboard/data/results.db-wal` and `-shm` files.

**Browser screen tears / unresponsive** — the dashboard tears down Chart.js
instances on view switches, but if the tab keeps a chart open for a long time
without re-rendering, refresh the page. Tables are scoped to scroll containers
(`max-height: 540px`) so they should never grow unbounded.

**`Reset All Stats` doesn't delete files on disk** — by design. It clears the
`runs` and `tests` tables but leaves the `.db` file in place so the next
`npm test` can write to it without re-creating the schema.

---

## Architecture decisions

- **Vanilla JS + Chart.js (no React/Vue)** — the dashboard is small (≈1k LOC),
  has no build step, ships as a single `app.js` file, and runs in any browser
  without a bundler. Chart.js handles all visualisations.
- **SQLite via `better-sqlite3`** — synchronous, embedded, prebuilt binaries on
  macOS / Linux / Windows. No daemon, no migrations, no race conditions for a
  single-writer / many-reader workload.
- **Static-analysis "coverage"** — Playwright doesn't natively expose
  describe/test counts via reporter events. We re-parse the `tests/` directory
  from the dashboard server (cached 30s) so the Coverage view always reflects
  what's currently checked in, not what was last executed.
- **Aggregated tests** — the Tests view shows one row per *unique full title*
  across all runs in the time range, with the most recent status. This means a
  smoke run after a full run still shows the suite's full inventory rather than
  collapsing to 22 tests.
- **AbortController on every fetch** — switching views aborts the previous
  view's in-flight requests so stale data can never overwrite the new view.
- **No back-end framework heavier than Express** — keeps the dependency surface
  small. All business logic is in three TS files (`db.ts`, `routes.ts`,
  `coverage.ts`); each is unit-testable in isolation.

---

Built for end-to-end regression testing of public web apps.
Pull requests welcome — please run `npm run lint && npm run typecheck && npm test` before opening one.
