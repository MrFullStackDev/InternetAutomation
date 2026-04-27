import fs from 'node:fs';
import path from 'node:path';

export interface FileCoverage {
  file: string;
  folder: string;
  testCases: number;
  describeBlocks: number;
  bugTags: number;
  sizeBytes: number;
}

export interface FolderCoverage {
  folder: string;
  testCases: number;
  files: number;
}

export interface CoverageReport {
  totalSpecFiles: number;
  totalTestCases: number;
  totalDescribeBlocks: number;
  totalBugTags: number;
  byFile: FileCoverage[];
  byFolder: FolderCoverage[];
}

const SPEC_EXTENSIONS = ['.spec.ts', '.spec.tsx', '.spec.js', '.test.ts'];

const DESCRIBE_RE = /(?:^|[^.\w])test\.describe(?:\.\w+)?\s*\(/gm;
const TEST_CASE_RE = /(?:^|[^.\w])test(?:\.(?:only|skip|fixme|fail|step))?\s*\(/gm;
const BUG_TAG_RE = /(?:\btest\.(?:skip|fixme|fail)\b|\/\/\s*(?:TODO|FIXME|XXX|HACK|BUG)\b)/gi;

function countMatches(text: string, re: RegExp): number {
  let n = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    n++;
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return n;
}

function isSpecFile(filename: string): boolean {
  return SPEC_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && isSpecFile(entry.name)) out.push(full);
  }
}

function feature(rel: string): string {
  // e.g. "tests/auth/form-auth.spec.ts" -> "form-auth"
  return path.basename(rel).replace(/\.(spec|test)\.(ts|tsx|js)$/, '');
}

export function buildCoverageReport(testsRoot: string): CoverageReport {
  const projectRoot = path.dirname(testsRoot);
  const all: string[] = [];
  walk(testsRoot, all);

  const byFile: FileCoverage[] = [];
  for (const abs of all) {
    let stat: fs.Stats;
    let content: string;
    try {
      stat = fs.statSync(abs);
      content = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    const rel = path.relative(projectRoot, abs);
    const parts = path.relative(testsRoot, abs).split(path.sep);
    const folder = parts.length > 1 ? parts[0] : 'root';

    // TEST_CASE_RE excludes test.describe by construction, so no subtraction needed.
    const describeBlocks = countMatches(content, DESCRIBE_RE);
    const testCases = countMatches(content, TEST_CASE_RE);
    const bugTags = countMatches(content, BUG_TAG_RE);

    byFile.push({
      file: rel,
      folder,
      testCases,
      describeBlocks,
      bugTags,
      sizeBytes: stat.size,
    });
  }

  byFile.sort((a, b) => b.testCases - a.testCases || a.file.localeCompare(b.file));

  const folderMap = new Map<string, FolderCoverage>();
  for (const f of byFile) {
    const cur = folderMap.get(f.folder) ?? { folder: f.folder, testCases: 0, files: 0 };
    cur.testCases += f.testCases;
    cur.files += 1;
    folderMap.set(f.folder, cur);
  }
  const byFolder = [...folderMap.values()].sort((a, b) => b.testCases - a.testCases);

  return {
    totalSpecFiles: byFile.length,
    totalTestCases: byFile.reduce((s, f) => s + f.testCases, 0),
    totalDescribeBlocks: byFile.reduce((s, f) => s + f.describeBlocks, 0),
    totalBugTags: byFile.reduce((s, f) => s + f.bugTags, 0),
    byFile,
    byFolder,
  };
}

export function featureName(file: string): string {
  return feature(file);
}
