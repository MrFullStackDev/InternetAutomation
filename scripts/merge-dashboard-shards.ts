#!/usr/bin/env tsx
/**
 * Merge per-shard SQLite databases produced by parallel CI matrix jobs into a
 * single `dashboard/data/results.db` with one logical "run" per workflow.
 *
 * Input:  dashboard/data-shards/dashboard-data-*\/results-*.db  (from artifacts)
 * Output: dashboard/data/results.db  (consumed by `npm run build:static`)
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const PROJECT_ROOT = process.cwd();
const SHARD_ROOT = path.join(PROJECT_ROOT, 'dashboard/data-shards');
const OUT_DB = path.join(PROJECT_ROOT, 'dashboard/data/results.db');

interface ShardRun {
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

function findShardDbs(): string[] {
  if (!fs.existsSync(SHARD_ROOT)) return [];
  const dbs: string[] = [];
  for (const entry of fs.readdirSync(SHARD_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(SHARD_ROOT, entry.name);
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.db')) dbs.push(path.join(dir, f));
    }
  }
  return dbs.sort();
}

function ensureSchema(db: Database.Database): void {
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
}

function groupKey(run: ShardRun): string {
  return `${run.commit_sha ?? 'no-sha'}::${run.branch ?? 'no-branch'}::${run.project}`;
}

function main(): void {
  const shardDbs = findShardDbs();
  if (shardDbs.length === 0) {
    console.warn('No shard DBs found under', SHARD_ROOT);
    return;
  }
  console.log(`• Merging ${shardDbs.length} shard database(s)…`);

  fs.mkdirSync(path.dirname(OUT_DB), { recursive: true });
  fs.rmSync(OUT_DB, { force: true });
  const out = new Database(OUT_DB);
  out.pragma('journal_mode = WAL');
  out.pragma('foreign_keys = ON');
  ensureSchema(out);

  const runsByKey = new Map<string, { runId: number; runs: ShardRun[] }>();

  const insertRun = out.prepare(
    `INSERT INTO runs (started_at, finished_at, project, branch, commit_sha, status,
                       total, passed, failed, skipped, flaky, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const updateRunAggregates = out.prepare(
    `UPDATE runs SET started_at = ?, finished_at = ?, status = ?,
                     total = ?, passed = ?, failed = ?, skipped = ?, flaky = ?, duration_ms = ?
     WHERE id = ?`,
  );
  const insertTest = out.prepare(
    `INSERT INTO tests (run_id, suite, title, full_title, file, project, status,
                        duration_ms, retries, error_message, error_stack, attachments_json, tags_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const importShard = out.transaction((shardPath: string) => {
    const shard = new Database(shardPath, { readonly: true });
    try {
      const runs = shard.prepare('SELECT * FROM runs').all() as Array<ShardRun & { id: number }>;
      for (const r of runs) {
        const key = groupKey(r);
        let bucket = runsByKey.get(key);
        if (!bucket) {
          const inserted = insertRun.run(
            r.started_at,
            r.finished_at,
            r.project,
            r.branch,
            r.commit_sha,
            r.status,
            0,
            0,
            0,
            0,
            0,
            0,
          );
          bucket = { runId: Number(inserted.lastInsertRowid), runs: [] };
          runsByKey.set(key, bucket);
        }
        bucket.runs.push(r);

        const tests = shard
          .prepare('SELECT * FROM tests WHERE run_id = ?')
          .all(r.id) as Array<{
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
        }>;
        for (const t of tests) {
          insertTest.run(
            bucket.runId,
            t.suite,
            t.title,
            t.full_title,
            t.file,
            t.project,
            t.status,
            t.duration_ms,
            t.retries,
            t.error_message,
            t.error_stack,
            t.attachments_json,
            t.tags_json,
          );
        }
      }
    } finally {
      shard.close();
    }
  });

  for (const dbPath of shardDbs) {
    importShard(dbPath);
  }

  for (const { runId, runs } of runsByKey.values()) {
    const startedAt = runs.map((r) => r.started_at).sort()[0] ?? new Date().toISOString();
    const finishedAt = runs
      .map((r) => r.finished_at)
      .filter((x): x is string => !!x)
      .sort()
      .reverse()[0] ?? null;
    const total = runs.reduce((s, r) => s + r.total, 0);
    const passed = runs.reduce((s, r) => s + r.passed, 0);
    const failed = runs.reduce((s, r) => s + r.failed, 0);
    const skipped = runs.reduce((s, r) => s + r.skipped, 0);
    const flaky = runs.reduce((s, r) => s + r.flaky, 0);
    const durationMs = runs.reduce((s, r) => Math.max(s, r.duration_ms), 0);
    const status = runs.some((r) => r.status === 'failed' || r.status === 'timedOut')
      ? 'failed'
      : (runs[0]?.status ?? 'passed');

    updateRunAggregates.run(
      startedAt,
      finishedAt,
      status,
      total,
      passed,
      failed,
      skipped,
      flaky,
      durationMs,
      runId,
    );
  }

  console.log(`✓ Merged ${shardDbs.length} shard(s) into ${runsByKey.size} run(s) at ${path.relative(PROJECT_ROOT, OUT_DB)}`);
  out.close();
}

main();
