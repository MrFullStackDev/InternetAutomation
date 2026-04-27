import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DASHBOARD_DB_PATH ?? 'dashboard/data/results.db';

let cached: Database.Database | null = null;

export function getDb(): Database.Database {
  if (cached) return cached;
  const absPath = path.resolve(process.cwd(), DB_PATH);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  const db = new Database(absPath, { fileMustExist: false });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Make sure the schema exists even if no run has populated it yet (so the dashboard
  // can boot before the first test run).
  db.exec(`
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

  cached = db;
  return db;
}
