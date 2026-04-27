#!/usr/bin/env tsx
/**
 * Export the dashboard as a fully static site under `dashboard-dist/`.
 *
 *   npm run build:static
 *
 * Reads the SQLite DB at `dashboard/data/results.db`, computes the same JSON
 * payloads the Express API serves, writes them to `dashboard-dist/data/*.json`,
 * and copies the HTML/CSS/JS shell. The result can be uploaded to GitHub Pages,
 * Cloudflare Pages, Netlify, S3, or any static host.
 *
 * The frontend auto-detects "static mode" at runtime by probing `/api/health`.
 * In static mode it reads from `./data/*.json`, hides the Reset / Refresh
 * buttons, and replaces the time-range popover with a build-timestamp badge.
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  buildCoverageReport,
  featureName,
  type CoverageReport,
  type FileCoverage,
} from '../dashboard/server/coverage.js';

interface RunRow {
  id: number;
  started_at: string;
  finished_at: string | null;
  project: string;
  branch: string | null;
  commit_sha: string | null;
  status: string | null;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration_ms: number;
}

interface TestRow {
  id: number;
  run_id: number;
  suite: string;
  title: string;
  full_title: string;
  file: string;
  project: string;
  status: string;
  duration_ms: number;
  retries: number;
  error_message: string | null;
  error_stack: string | null;
  attachments_json: string | null;
  tags_json: string | null;
}

const PROJECT_ROOT = process.cwd();
const DB_PATH = path.join(PROJECT_ROOT, 'dashboard/data/results.db');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'dashboard/public');
const DIST_DIR = path.join(PROJECT_ROOT, 'dashboard-dist');
const TESTS_DIR = path.join(PROJECT_ROOT, 'tests');

function passRate(row: { passed: number; total: number; skipped: number }): number {
  const denom = row.total - row.skipped;
  if (denom <= 0) return 0;
  return Math.round((row.passed / denom) * 1000) / 10;
}

function serializeRun(row: RunRow) {
  return {
    id: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    project: row.project,
    branch: row.branch,
    commit: row.commit_sha,
    status: row.status,
    total: row.total,
    passed: row.passed,
    failed: row.failed,
    skipped: row.skipped,
    flaky: row.flaky,
    durationMs: row.duration_ms,
    passRate: passRate(row),
  };
}

function serializeTest(row: TestRow) {
  return {
    id: row.id,
    runId: row.run_id,
    suite: row.suite,
    title: row.title,
    fullTitle: row.full_title,
    file: row.file,
    project: row.project,
    status: row.status,
    durationMs: row.duration_ms,
    retries: row.retries,
    errorMessage: row.error_message,
    errorStack: row.error_stack,
    attachments: row.attachments_json ? JSON.parse(row.attachments_json) : [],
    tags: row.tags_json ? JSON.parse(row.tags_json) : [],
  };
}

function paddedId(n: number): string {
  return `TST-${String(n).padStart(3, '0')}`;
}

function writeJson(absPath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, JSON.stringify(data, null, 2));
}

function ensureFreshDist(): void {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST_DIR, 'data', 'runs'), { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, 'data', 'by-suite'), { recursive: true });
}

function copyAssets(): void {
  for (const file of ['index.html', 'styles.css', 'app.js']) {
    fs.copyFileSync(path.join(PUBLIC_DIR, file), path.join(DIST_DIR, file));
  }
}

function exportEmptyDataset(coverage: CoverageReport): void {
  const empty = (extra: Record<string, unknown> = {}) => extra;
  writeJson(path.join(DIST_DIR, 'data', 'summary.json'), {
    totalRuns: 0,
    totalTests: 0,
    totalFailures: 0,
    latestRun: null,
  });
  writeJson(path.join(DIST_DIR, 'data', 'runs.json'), { runs: [] });
  writeJson(path.join(DIST_DIR, 'data', 'runs-summary.json'), {
    total: 0,
    healthy: 0,
    attention: 0,
    runs: [],
  });
  writeJson(path.join(DIST_DIR, 'data', 'trends.json'), { points: [] });
  writeJson(path.join(DIST_DIR, 'data', 'tests-aggregated.json'), {
    tests: [],
    total: 0,
    passed: 0,
    failed: 0,
    flaky: 0,
    files: [],
  });
  writeJson(path.join(DIST_DIR, 'data', 'triage.json'), {
    items: [],
    failed: 0,
    flaky: 0,
    attention: 0,
  });
  // coverage works even with zero runs (it's static analysis)
  writeJson(path.join(DIST_DIR, 'data', 'coverage.json'), {
    ...coverage,
    totalStaticTestCases: coverage.totalTestCases,
  });
  writeJson(path.join(DIST_DIR, 'data', 'features.json'), {
    features: coverage.byFile.map((f) => ({
      name: featureName(f.file),
      file: f.file,
      folder: f.folder,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      bugTags: f.bugTags,
      passRate: 0,
      hasResults: false,
      dots: [],
      dotOverflow: 0,
    })),
    healthy: 0,
    attention: coverage.byFile.length,
    total: coverage.byFile.length,
  });
  void empty;
}

function selectAggregatedTests(db: Database.Database, runIds: number[]): TestRow[] {
  if (runIds.length === 0) return [];
  const placeholders = runIds.map(() => '?').join(',');
  return db
    .prepare(
      `SELECT t.* FROM tests t
       INNER JOIN (
         SELECT full_title, MAX(run_id) AS max_run_id
         FROM tests
         WHERE run_id IN (${placeholders})
         GROUP BY full_title
       ) latest ON t.full_title = latest.full_title AND t.run_id = latest.max_run_id
       ORDER BY t.file ASC, t.suite ASC, t.title ASC`,
    )
    .all(...runIds) as TestRow[];
}

function exportCoverage(coverage: CoverageReport, aggregated: TestRow[]): void {
  const runtimeByFile = new Map<string, number>();
  for (const t of aggregated) {
    runtimeByFile.set(t.file, (runtimeByFile.get(t.file) ?? 0) + 1);
  }

  const byFile = coverage.byFile.map((f) => {
    const runtimeCount = runtimeByFile.get(f.file);
    return {
      ...f,
      testCases: runtimeCount ?? f.testCases,
      staticTestCases: f.testCases,
      runtimeTestCases: runtimeCount ?? null,
    };
  });

  const folderMap = new Map<string, { folder: string; testCases: number; files: number }>();
  for (const f of byFile) {
    const cur = folderMap.get(f.folder) ?? { folder: f.folder, testCases: 0, files: 0 };
    cur.testCases += f.testCases;
    cur.files += 1;
    folderMap.set(f.folder, cur);
  }
  const byFolder = [...folderMap.values()].sort((a, b) => b.testCases - a.testCases);

  writeJson(path.join(DIST_DIR, 'data', 'coverage.json'), {
    ...coverage,
    totalTestCases: byFile.reduce((s, f) => s + f.testCases, 0),
    totalStaticTestCases: coverage.totalTestCases,
    byFile: byFile.sort(
      (a, b) => b.testCases - a.testCases || a.file.localeCompare(b.file),
    ) as (FileCoverage & { staticTestCases: number; runtimeTestCases: number | null })[],
    byFolder,
  });
}

function exportFeatures(coverage: CoverageReport, aggregated: TestRow[]): void {
  interface FeatureAccum {
    name: string;
    file: string;
    folder: string;
    tests: { status: string; durationMs: number; retries: number }[];
    bugTags: number;
    hasResults: boolean;
  }
  const map = new Map<string, FeatureAccum>();
  for (const f of coverage.byFile) {
    map.set(f.file, {
      name: featureName(f.file),
      file: f.file,
      folder: f.folder,
      tests: [],
      bugTags: f.bugTags,
      hasResults: false,
    });
  }
  for (const t of aggregated) {
    let entry = map.get(t.file);
    if (!entry) {
      const segs = t.file.split(path.sep);
      const folder = segs.length > 1 ? (segs[1] ?? 'root') : 'root';
      entry = {
        name: featureName(t.file),
        file: t.file,
        folder,
        tests: [],
        bugTags: 0,
        hasResults: false,
      };
      map.set(t.file, entry);
    }
    entry.tests.push({ status: t.status, durationMs: t.duration_ms, retries: t.retries });
    entry.hasResults = true;
  }

  const features = [...map.values()]
    .map((f) => {
      const total = f.tests.length;
      const passed = f.tests.filter((t) => t.status === 'passed').length;
      const failed = f.tests.filter((t) => t.status === 'failed').length;
      const skipped = f.tests.filter((t) => t.status === 'skipped').length;
      const denom = total - skipped;
      const rate = denom > 0 ? Math.round((passed / denom) * 1000) / 10 : 0;
      return {
        name: f.name,
        file: f.file,
        folder: f.folder,
        total,
        passed,
        failed,
        skipped,
        bugTags: f.bugTags,
        passRate: rate,
        hasResults: f.hasResults,
        dots: f.tests.slice(0, 30).map((t) => t.status),
        dotOverflow: Math.max(0, f.tests.length - 30),
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const healthy = features.filter((f) => f.hasResults && f.passRate >= 80).length;
  const attention = features.filter((f) => !f.hasResults || f.passRate < 80).length;

  writeJson(path.join(DIST_DIR, 'data', 'features.json'), {
    features,
    healthy,
    attention,
    total: features.length,
  });
}

function main(): void {
  console.log('• Building static dashboard…');
  ensureFreshDist();
  copyAssets();

  const coverage = buildCoverageReport(TESTS_DIR);
  console.log(`  coverage: ${coverage.totalSpecFiles} spec files, ${coverage.totalTestCases} static cases`);

  if (!fs.existsSync(DB_PATH)) {
    console.warn('  (no results.db yet — exporting empty run data; coverage analysis still included)');
    exportEmptyDataset(coverage);
    writeManifest(0, 0);
    finalize();
    return;
  }

  const db = new Database(DB_PATH, { readonly: true });
  try {
    const allRuns = db.prepare('SELECT * FROM runs ORDER BY started_at DESC').all() as RunRow[];

    // ---- summary ----
    const totals = db
      .prepare(
        `SELECT COUNT(*) AS runs, COALESCE(SUM(total), 0) AS tests, COALESCE(SUM(failed), 0) AS failures
         FROM runs`,
      )
      .get() as { runs: number; tests: number; failures: number };
    const latest = allRuns[0] ?? null;
    writeJson(path.join(DIST_DIR, 'data', 'summary.json'), {
      totalRuns: totals.runs,
      totalTests: totals.tests,
      totalFailures: totals.failures,
      latestRun: latest ? serializeRun(latest) : null,
    });

    // ---- runs ----
    writeJson(path.join(DIST_DIR, 'data', 'runs.json'), { runs: allRuns.map(serializeRun) });

    // ---- runs-summary ----
    let healthy = 0;
    let attention = 0;
    for (const r of allRuns) {
      if (passRate(r) >= 80) healthy++;
      else attention++;
    }
    writeJson(path.join(DIST_DIR, 'data', 'runs-summary.json'), {
      total: allRuns.length,
      healthy,
      attention,
      runs: allRuns.map(serializeRun),
    });

    // ---- trends ----
    const trendsOrdered = [...allRuns].reverse().slice(-30);
    writeJson(path.join(DIST_DIR, 'data', 'trends.json'), {
      points: trendsOrdered.map((r) => ({
        runId: r.id,
        startedAt: r.started_at,
        passRate: passRate(r),
        passed: r.passed,
        failed: r.failed,
        skipped: r.skipped,
        flaky: r.flaky,
        durationMs: r.duration_ms,
      })),
    });

    // ---- per-run + by-suite ----
    for (const r of allRuns) {
      const tests = db
        .prepare(`SELECT * FROM tests WHERE run_id = ? ORDER BY status DESC, suite ASC, title ASC`)
        .all(r.id) as TestRow[];
      writeJson(path.join(DIST_DIR, 'data', 'runs', `${r.id}.json`), {
        run: serializeRun(r),
        tests: tests.map(serializeTest),
      });
      const suites = db
        .prepare(
          `SELECT suite,
                  COUNT(*) AS total,
                  SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS passed,
                  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
                  SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped
           FROM tests WHERE run_id = ?
           GROUP BY suite ORDER BY suite ASC`,
        )
        .all(r.id);
      writeJson(path.join(DIST_DIR, 'data', 'by-suite', `${r.id}.json`), { suites });
    }

    // ---- aggregated tests / triage / coverage / features ----
    const aggregated = selectAggregatedTests(db, allRuns.map((r) => r.id));
    const aggregatedSerialized = aggregated.map((t, idx) => ({
      id: paddedId(idx + 1),
      title: t.title,
      fullTitle: t.full_title,
      suite: t.suite,
      file: t.file,
      status: t.status,
      durationMs: t.duration_ms,
      retries: t.retries,
      errorMessage: t.error_message,
      runId: t.run_id,
    }));
    const passedCt = aggregatedSerialized.filter((t) => t.status === 'passed').length;
    const failedCt = aggregatedSerialized.filter((t) => t.status === 'failed').length;
    const flakyCt = aggregatedSerialized.filter((t) => t.status === 'passed' && t.retries > 0).length;
    const files = [...new Set(aggregatedSerialized.map((t) => t.file))].sort();
    writeJson(path.join(DIST_DIR, 'data', 'tests-aggregated.json'), {
      tests: aggregatedSerialized,
      total: aggregatedSerialized.length,
      passed: passedCt,
      failed: failedCt,
      flaky: flakyCt,
      files,
    });

    const triageItems = aggregated
      .filter((t) => t.status === 'failed' || (t.status === 'passed' && t.retries > 0))
      .map((t) => ({
        id: t.id,
        title: t.title,
        fullTitle: t.full_title,
        file: t.file,
        suite: t.suite,
        status: t.status === 'failed' ? 'failed' : 'flaky',
        retries: t.retries,
        durationMs: t.duration_ms,
        errorMessage: t.error_message,
        errorStack: t.error_stack,
        attachments: t.attachments_json ? JSON.parse(t.attachments_json) : [],
      }));
    writeJson(path.join(DIST_DIR, 'data', 'triage.json'), {
      items: triageItems,
      failed: triageItems.filter((i) => i.status === 'failed').length,
      flaky: triageItems.filter((i) => i.status === 'flaky').length,
      attention: triageItems.length,
    });

    exportCoverage(coverage, aggregated);
    exportFeatures(coverage, aggregated);

    writeManifest(allRuns.length, aggregatedSerialized.length);
    console.log(`  exported ${allRuns.length} run(s), ${aggregatedSerialized.length} unique test(s)`);
  } finally {
    db.close();
  }
  finalize();
}

function writeManifest(runs: number, tests: number): void {
  writeJson(path.join(DIST_DIR, 'data', 'manifest.json'), {
    builtAt: new Date().toISOString(),
    runs,
    tests,
    mode: 'static',
  });
}

function finalize(): void {
  console.log(`✓ Static dashboard ready at ${path.relative(PROJECT_ROOT, DIST_DIR)}/`);
  console.log('  Serve locally with:    npx serve dashboard-dist');
  console.log('  Or upload the directory to GitHub Pages / Cloudflare Pages / S3 / Netlify.');
}

main();
