export type TestStatusValue = 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';

export interface RunSummary {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;
  branch: string | null;
  commit: string | null;
}

export interface TestRecord {
  id: number;
  runId: number;
  suite: string;
  title: string;
  fullTitle: string;
  file: string;
  project: string;
  status: TestStatusValue;
  durationMs: number;
  retries: number;
  errorMessage: string | null;
  errorStack: string | null;
  attachments: AttachmentRef[];
  tags: string[];
}

export interface AttachmentRef {
  name: string;
  path: string | null;
  contentType: string | null;
}
