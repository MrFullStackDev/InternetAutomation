import path from 'node:path';
import { Router } from 'express';
import { getDb } from './db.js';
import { buildCoverageReport, featureName, type CoverageReport, type FileCoverage } from './coverage.js';

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

const TESTS_ROOT = path.resolve(process.cwd(), 'tests');
const COVERAGE_TTL_MS = 30_000;
let cachedCoverage: { at: number; report: CoverageReport } | null = null;

function getCoverage(force = false): CoverageReport {
  const now = Date.now();
  if (!force && cachedCoverage && now - cachedCoverage.at < COVERAGE_TTL_MS) {
    return cachedCoverage.report;
  }
  const report = buildCoverageReport(TESTS_ROOT);
  cachedCoverage = { at: now, report };
  return report;
}

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

/** Parse and validate the optional ?days=N query param. */
function parseDays(req: { query: Record<string, unknown> }): number | null {
  const raw = req.query.days;
  if (raw === undefined || raw === '' || raw === 'all') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.floor(n), 365);
}

function runsWhere(days: number | null): { where: string; params: unknown[] } {
  if (days === null) return { where: '', params: [] };
  return { where: `WHERE started_at >= datetime('now', ?)`, params: [`-${days} days`] };
}

function paddedId(n: number): string {
  return `TST-${String(n).padStart(3, '0')}`;
}

function selectLatestRun(days: number | null): RunRow | null {
  const db = getDb();
  const { where, params } = runsWhere(days);
  return (
    (db
      .prepare(`SELECT * FROM runs ${where} ORDER BY started_at DESC LIMIT 1`)
      .get(...params) as RunRow | undefined) ?? null
  );
}

function selectAllRuns(days: number | null): RunRow[] {
  const db = getDb();
  const { where, params } = runsWhere(days);
  return db
    .prepare(`SELECT * FROM runs ${where} ORDER BY started_at DESC`)
    .all(...params) as RunRow[];
}

/** Returns test records for the given runIds, deduplicated to the most recent
 *  occurrence per fullTitle (so a test that ran in multiple runs appears once). */
function selectAggregatedTests(runIds: number[]): TestRow[] {
  if (runIds.length === 0) return [];
  const db = getDb();
  const placeholders = runIds.map(() => '?').join(',');
  // For each unique full_title, pick the row with the highest run_id (= most recent).
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

export function buildRouter(): Router {
  const router = Router();
  const db = getDb();

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // -------- Run lists / summaries --------

  router.get('/runs', (req, res) => {
    const days = parseDays(req);
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const { where, params } = runsWhere(days);
    const rows = db
      .prepare(`SELECT * FROM runs ${where} ORDER BY started_at DESC LIMIT ?`)
      .all(...params, limit) as RunRow[];
    res.json({ runs: rows.map(serializeRun) });
  });

  router.get('/runs/latest', (req, res) => {
    const row = selectLatestRun(parseDays(req));
    res.json({ run: row ? serializeRun(row) : null });
  });

  router.get('/runs/:id', (req, res) => {
    const id = Number(req.params.id);
    const run = db.prepare(`SELECT * FROM runs WHERE id = ?`).get(id) as RunRow | undefined;
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    const tests = db
      .prepare(`SELECT * FROM tests WHERE run_id = ? ORDER BY status DESC, suite ASC, title ASC`)
      .all(id) as TestRow[];
    res.json({ run: serializeRun(run), tests: tests.map(serializeTest) });
  });

  router.get('/summary', (req, res) => {
    const days = parseDays(req);
    const { where, params } = runsWhere(days);
    const totals = db
      .prepare(
        `SELECT COUNT(*) AS runs, COALESCE(SUM(total), 0) AS tests, COALESCE(SUM(failed), 0) AS failures
         FROM runs ${where}`,
      )
      .get(...params) as { runs: number; tests: number; failures: number };
    const latest = selectLatestRun(days);
    res.json({
      totalRuns: totals.runs,
      totalTests: totals.tests,
      totalFailures: totals.failures,
      latestRun: latest ? serializeRun(latest) : null,
    });
  });

  router.get('/runs-summary', (req, res) => {
    const runs = selectAllRuns(parseDays(req));
    let healthy = 0;
    let attention = 0;
    for (const r of runs) {
      const rate = passRate(r);
      if (rate >= 80) healthy++;
      else attention++;
    }
    res.json({
      total: runs.length,
      healthy,
      attention,
      runs: runs.map(serializeRun),
    });
  });

  router.get('/trends', (req, res) => {
    const days = parseDays(req);
    const limit = Math.min(Number(req.query.limit ?? 30), 200);
    const { where, params } = runsWhere(days);
    const rows = db
      .prepare(`SELECT * FROM runs ${where} ORDER BY started_at DESC LIMIT ?`)
      .all(...params, limit) as RunRow[];
    const ordered = [...rows].reverse();
    res.json({
      points: ordered.map((r) => ({
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
  });

  router.get('/by-suite', (req, res) => {
    const runId = Number(req.query.runId);
    if (!runId) {
      res.status(400).json({ error: 'runId is required' });
      return;
    }
    const rows = db
      .prepare(
        `SELECT suite,
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS passed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
                SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped
         FROM tests
         WHERE run_id = ?
         GROUP BY suite
         ORDER BY suite ASC`,
      )
      .all(runId) as Array<{
      suite: string;
      total: number;
      passed: number;
      failed: number;
      skipped: number;
    }>;
    res.json({ suites: rows });
  });

  // -------- Coverage / Features / Tests aggregations --------

  // Coverage merges static analysis (file inventory, describes, bug tags) with the
  // runtime test counts from the most recent runs. This way the per-file "Test Cases"
  // matches what Playwright actually executed (including parameterized loops that the
  // static regex can't unroll), and KPI totals across Coverage and Tests stay in sync.
  router.get('/coverage', (req, res) => {
    const force = req.query.refresh === '1';
    const days = parseDays(req);
    const report = getCoverage(force);
    const runs = selectAllRuns(days);
    const runtimeTests = selectAggregatedTests(runs.map((r) => r.id));

    const runtimeByFile = new Map<string, number>();
    for (const t of runtimeTests) {
      runtimeByFile.set(t.file, (runtimeByFile.get(t.file) ?? 0) + 1);
    }

    const byFile = report.byFile.map((f) => {
      const runtimeCount = runtimeByFile.get(f.file);
      return {
        ...f,
        // prefer runtime when we have it (counts parameterized instances correctly);
        // fall back to static for files that haven't been executed yet.
        testCases: runtimeCount ?? f.testCases,
        staticTestCases: f.testCases,
        runtimeTestCases: runtimeCount ?? null,
      };
    });

    // Re-aggregate folder + global totals from the merged per-file values so every
    // header counter stays consistent with the inventory table below it.
    const byFolderMap = new Map<string, { folder: string; testCases: number; files: number }>();
    for (const f of byFile) {
      const cur = byFolderMap.get(f.folder) ?? { folder: f.folder, testCases: 0, files: 0 };
      cur.testCases += f.testCases;
      cur.files += 1;
      byFolderMap.set(f.folder, cur);
    }
    const byFolder = [...byFolderMap.values()].sort((a, b) => b.testCases - a.testCases);

    res.json({
      ...report,
      totalTestCases: byFile.reduce((s, f) => s + f.testCases, 0),
      byFile: byFile.sort(
        (a, b) => b.testCases - a.testCases || a.file.localeCompare(b.file),
      ),
      byFolder,
      // include the raw static count so callers that care can still see the source-only number.
      totalStaticTestCases: report.totalTestCases,
    });
  });

  router.get('/coverage/files', (_req, res) => {
    const report = getCoverage();
    res.json({ files: report.byFile as FileCoverage[] });
  });

  router.get('/features', (req, res) => {
    const days = parseDays(req);
    const report = getCoverage();
    const runs = selectAllRuns(days);
    const tests = selectAggregatedTests(runs.map((r) => r.id));

    interface FeatureAccum {
      name: string;
      file: string;
      folder: string;
      tests: Array<{ status: string; title: string; durationMs: number; retries: number }>;
      bugTags: number;
      hasResults: boolean;
    }

    const map = new Map<string, FeatureAccum>();
    for (const f of report.byFile) {
      map.set(f.file, {
        name: featureName(f.file),
        file: f.file,
        folder: f.folder,
        tests: [],
        bugTags: f.bugTags,
        hasResults: false,
      });
    }

    for (const t of tests) {
      const key = t.file;
      let entry = map.get(key);
      if (!entry) {
        const segs = key.split(path.sep);
        const folder = segs.length > 1 ? segs[1] ?? 'root' : 'root';
        entry = {
          name: featureName(key),
          file: key,
          folder,
          tests: [],
          bugTags: 0,
          hasResults: false,
        };
        map.set(key, entry);
      }
      entry.tests.push({
        status: t.status,
        title: t.title,
        durationMs: t.duration_ms,
        retries: t.retries,
      });
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

    res.json({ features, healthy, attention, total: features.length });
  });

  router.get('/tests-aggregated', (req, res) => {
    const days = parseDays(req);
    const runs = selectAllRuns(days);
    if (runs.length === 0) {
      res.json({ tests: [], total: 0, passed: 0, failed: 0, flaky: 0, files: [] });
      return;
    }

    // Aggregate the latest result per unique fullTitle across the selected window.
    const tests = selectAggregatedTests(runs.map((r) => r.id));
    const aggregated = tests.map((t, idx) => ({
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
    const passed = aggregated.filter((t) => t.status === 'passed').length;
    const failed = aggregated.filter((t) => t.status === 'failed').length;
    const flaky = aggregated.filter((t) => t.status === 'passed' && t.retries > 0).length;
    const files = [...new Set(aggregated.map((t) => t.file))].sort();
    res.json({
      tests: aggregated,
      total: aggregated.length,
      passed,
      failed,
      flaky,
      files,
    });
  });

  router.get('/triage', (req, res) => {
    const days = parseDays(req);
    const runs = selectAllRuns(days);
    if (runs.length === 0) {
      res.json({ items: [], failed: 0, flaky: 0, attention: 0 });
      return;
    }
    const tests = selectAggregatedTests(runs.map((r) => r.id));
    const items = tests
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
    const failed = items.filter((i) => i.status === 'failed').length;
    const flaky = items.filter((i) => i.status === 'flaky').length;
    res.json({ items, failed, flaky, attention: items.length });
  });

  router.get('/tests/:id', (req, res) => {
    const id = Number(req.params.id);
    const row = db.prepare(`SELECT * FROM tests WHERE id = ?`).get(id) as TestRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }
    res.json({ test: serializeTest(row) });
  });

  // -------- Mutating endpoints --------

  /**
   * DELETE /api/runs - wipe all runs and tests. Frontend prompts for confirmation.
   * We don't expose row-level deletes; use this for "Reset All Stats".
   */
  router.delete('/runs', (_req, res) => {
    const tx = db.transaction(() => {
      db.exec('DELETE FROM tests; DELETE FROM runs; DELETE FROM sqlite_sequence WHERE name IN (\'runs\', \'tests\');');
    });
    try {
      tx();
      cachedCoverage = null;
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  return router;
}
