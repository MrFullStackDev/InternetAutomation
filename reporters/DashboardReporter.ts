import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

interface RecordedAttachment {
  name: string;
  path: string | null;
  contentType: string | null;
}

const DB_PATH = process.env.DASHBOARD_DB_PATH ?? 'dashboard/data/results.db';

export default class DashboardReporter implements Reporter {
  private db!: Database.Database;
  private runId!: number;
  private startTime = Date.now();
  private projectName = 'unknown';

  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    this.projectName = config.projects[0]?.name ?? 'default';
    this.openDatabase();
    this.ensureSchema();

    const total = suite.allTests().length;
    const stmt = this.db.prepare(
      `INSERT INTO runs (started_at, project, branch, commit_sha, total, passed, failed, skipped, flaky, duration_ms)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0)`,
    );
    const result = stmt.run(
      new Date(this.startTime).toISOString(),
      this.projectName,
      process.env.GIT_BRANCH ?? null,
      process.env.GIT_COMMIT ?? null,
      total,
    );
    this.runId = Number(result.lastInsertRowid);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.db || !this.runId) return;
    const status = this.normalizeStatus(result.status);
    const tags = test.tags ?? [];
    const file = path.relative(process.cwd(), test.location.file);
    const suiteTitle = test.parent.title || 'root';
    const fullTitle = test.titlePath().slice(1).join(' › ');

    const errorMessage = result.error?.message ?? null;
    const errorStack = result.error?.stack ?? null;

    const attachments: RecordedAttachment[] = result.attachments.map((a) => ({
      name: a.name,
      path: a.path ? path.relative(process.cwd(), a.path) : null,
      contentType: a.contentType ?? null,
    }));

    this.db
      .prepare(
        `INSERT INTO tests (
          run_id, suite, title, full_title, file, project, status,
          duration_ms, retries, error_message, error_stack, attachments_json, tags_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        this.runId,
        suiteTitle,
        test.title,
        fullTitle,
        file,
        this.projectName,
        status,
        Math.round(result.duration),
        result.retry,
        errorMessage,
        errorStack,
        JSON.stringify(attachments),
        JSON.stringify(tags),
      );
  }

  onEnd(result: FullResult): void | Promise<void> {
    if (!this.db || !this.runId) return;
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - this.startTime;

    const counts = this.db
      .prepare(
        `SELECT
          SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS passed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
          SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped,
          SUM(CASE WHEN retries > 0 AND status = 'passed' THEN 1 ELSE 0 END) AS flaky
         FROM tests WHERE run_id = ?`,
      )
      .get(this.runId) as {
      passed: number | null;
      failed: number | null;
      skipped: number | null;
      flaky: number | null;
    };

    this.db
      .prepare(
        `UPDATE runs
         SET finished_at = ?, duration_ms = ?, passed = ?, failed = ?, skipped = ?, flaky = ?, status = ?
         WHERE id = ?`,
      )
      .run(
        finishedAt,
        durationMs,
        counts.passed ?? 0,
        counts.failed ?? 0,
        counts.skipped ?? 0,
        counts.flaky ?? 0,
        result.status,
        this.runId,
      );

    this.db.close();
  }

  private openDatabase(): void {
    const absDbPath = path.resolve(process.cwd(), DB_PATH);
    fs.mkdirSync(path.dirname(absDbPath), { recursive: true });
    this.db = new Database(absDbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        project TEXT NOT NULL,
        branch TEXT,
        commit_sha TEXT,
        status TEXT,
        total INTEGER NOT NULL DEFAULT 0,
        passed INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        skipped INTEGER NOT NULL DEFAULT 0,
        flaky INTEGER NOT NULL DEFAULT 0,
        duration_ms INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        suite TEXT NOT NULL,
        title TEXT NOT NULL,
        full_title TEXT NOT NULL,
        file TEXT NOT NULL,
        project TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        retries INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        error_stack TEXT,
        attachments_json TEXT,
        tags_json TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_tests_run_id ON tests(run_id);
      CREATE INDEX IF NOT EXISTS idx_tests_full_title ON tests(full_title);
      CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
      CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at);
    `);
  }

  private normalizeStatus(status: TestResult['status']): string {
    switch (status) {
      case 'passed':
        return 'passed';
      case 'failed':
        return 'failed';
      case 'timedOut':
        return 'failed';
      case 'interrupted':
        return 'failed';
      case 'skipped':
        return 'skipped';
      default:
        return String(status);
    }
  }
}
