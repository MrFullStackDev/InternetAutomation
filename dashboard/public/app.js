/* InternetAutomation – Test Observability Dashboard
 * Vanilla-JS SPA with hash-based routing across six views (Dashboard, Runs,
 * Tests, Features, Coverage, Triage). Uses Chart.js for charts and the
 * built-in Fetch API for transport. Each view manages its own loading/error
 * state and old Chart.js instances are torn down on view switches to keep
 * memory bounded.
 */

// ---------- Constants ----------
const COLORS = {
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#2563eb',
  brand: '#0d9488',
  brandSoftRgba: 'rgba(13, 148, 136, 0.12)',
  muted: '#9ca3af',
  donut: ['#0d9488', '#10b981', '#ef4444', '#2563eb', '#f59e0b', '#06b6d4', '#ec4899', '#6366f1', '#84cc16'],
};

const PAGE_META = {
  dashboard: { title: 'Dashboard', subtitle: 'Test health overview' },
  runs: { title: 'Test Runs', subtitle: 'View and filter test execution runs' },
  tests: { title: 'Tests', subtitle: 'View all tests across your test runs' },
  features: { title: 'Features', subtitle: 'Test coverage by spec file / feature area' },
  coverage: { title: 'Coverage', subtitle: 'Spec file analysis and test inventory' },
  triage: { title: 'Triage', subtitle: 'Inspect failing and flaky tests' },
};

const RANGE_LABELS = {
  '1': 'Last 24 hours',
  '7': 'Last 7 days',
  '30': 'Last 30 days',
  '': 'All time',
};

// ---------- Mutable state ----------
const state = {
  view: null,
  days: '7', // string so it round-trips with dataset attributes
  // each view's render attaches its own AbortController + render-id so that
  // stale fetches/responses don't overwrite a newer view's DOM.
  renderId: 0,
  abort: null,
  // simple in-memory caches; cleared on Refresh and on time-range changes
  cache: {},
  // track per-view UI state across renders (sort dirs, selected rows, etc.)
  ui: {
    runsSearch: '',
    testsSearch: '',
    testsStatus: '',
    testsFile: '',
    testsSort: { col: 'id', dir: 'asc' },
    featuresTab: 'all',
    triageSearch: '',
    triageSelected: null,
  },
};

// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);

const fmtDuration = (ms) => {
  if (!ms || ms < 0) return '0s';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
};

const fmtSize = (b) => {
  if (b == null) return '';
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
};

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// ---------- Static-mode data layer ----------
// The same UI runs against either the live Express API (npm run dashboard) or a
// pre-baked set of JSON files (built by `npm run build:static` and uploaded to a
// static host). On boot we probe /api/health: success → live mode, failure →
// static mode. In static mode the time-range filter is a no-op (the export
// captures all data once) and Reset/Refresh are hidden.
const IS_STATIC = { value: false, manifest: null };

function withDays(url) {
  if (IS_STATIC.value) return url; // static export ignores ?days; one snapshot per build
  if (state.days === '') return url;
  return url + (url.includes('?') ? '&' : '?') + `days=${state.days}`;
}

/** Map an /api/* URL to its static counterpart (./data/*.json) when running
 *  without a live backend. Live mode passes the URL through unchanged. */
function resolveUrl(url) {
  if (!IS_STATIC.value) return url;
  if (!url.startsWith('/api/')) return url; // already relative, e.g. /artifacts/...
  const [pathOnly, query] = url.split('?');
  if (pathOnly === '/api/by-suite') {
    const params = new URLSearchParams(query ?? '');
    return `./data/by-suite/${params.get('runId')}.json`;
  }
  // /api/X         → ./data/X.json
  // /api/runs/123  → ./data/runs/123.json
  return './data' + pathOnly.slice('/api'.length) + '.json';
}

async function fetchJson(url, signal) {
  const res = await fetch(resolveUrl(url), { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ` – ${text}` : ''}`);
  }
  return res.json();
}

/** Probe whether a live API is reachable. Falls back to static mode if not. */
async function detectMode() {
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    IS_STATIC.value = !res.ok;
  } catch {
    IS_STATIC.value = true;
  }
  if (IS_STATIC.value) {
    try {
      IS_STATIC.manifest = await fetch('./data/manifest.json').then((r) => (r.ok ? r.json() : null));
    } catch {
      IS_STATIC.manifest = null;
    }
  }
}

// ---------- Chart cleanup ----------
const charts = {};
function destroyChart(name) {
  if (charts[name]) {
    try { charts[name].destroy(); } catch { /* noop */ }
    charts[name] = null;
  }
}
function destroyAllCharts() {
  for (const k of Object.keys(charts)) destroyChart(k);
}

// ---------- Toast ----------
const toastEl = $('#toast');
let toastTimer = null;
function toast(message, kind = '') {
  toastEl.textContent = message;
  toastEl.className = `toast visible ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2400);
}

// ---------- Icons ----------
const ICONS = {
  total: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  pass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  fail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  flaky: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  files: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  cases: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12A10 10 0 1 1 5.93 7.51"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  describe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  bug: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="14" rx="4"/><path d="M19 7l-3 2"/><path d="M5 7l3 2"/><path d="M19 13H22"/><path d="M2 13h3"/><path d="M19 19l-3-2"/><path d="M5 19l3-2"/></svg>`,
};

// ---------- Status badge / KPI markup ----------
const statusBadge = (status) => `<span class="badge ${status}">${status}</span>`;

function kpi(label, value, opts = {}) {
  const cls = opts.color ? `kpi-value ${opts.color}` : 'kpi-value';
  const icon = opts.icon ? `<div class="kpi-icon">${opts.icon}</div>` : '';
  return `<div class="kpi">
    <div>
      <div class="kpi-label">${escapeHtml(label)}</div>
      <div class="${cls}">${value}</div>
    </div>
    ${icon}
  </div>`;
}

// ---------- View shells ----------

/** Show a spinner while a view is loading. */
function renderLoading(root) {
  root.innerHTML = `<div class="card"><div class="state"><div class="spinner"></div><div>Loading…</div></div></div>`;
}

/** Show an error state with retry. */
function renderError(root, message, onRetry) {
  root.innerHTML = `<div class="card"><div class="state">
    <div class="icon">${ICONS.fail}</div>
    <div class="title">Couldn't load this view</div>
    <div>${escapeHtml(message)}</div>
    <div class="actions"><button class="btn" id="retry-btn" type="button">Retry</button></div>
  </div></div>`;
  $('#retry-btn', root).addEventListener('click', onRetry);
}

const emptyState = (title, body, icon = ICONS.empty) => `<div class="state">
  <div class="icon">${icon}</div>
  <div class="title">${escapeHtml(title)}</div>
  <div>${escapeHtml(body)}</div>
</div>`;

// ---------- Router ----------

function setView(name) {
  if (!PAGE_META[name]) name = 'dashboard';
  destroyAllCharts();
  if (state.abort) {
    try { state.abort.abort(); } catch { /* noop */ }
  }
  state.abort = new AbortController();
  state.renderId++;
  state.view = name;

  $('#page-title').textContent = PAGE_META[name].title;
  $('#page-subtitle').textContent = PAGE_META[name].subtitle;
  for (const item of document.querySelectorAll('.nav-item')) {
    item.classList.toggle('active', item.dataset.view === name);
  }
  for (const view of document.querySelectorAll('.view')) {
    const id = view.id.replace('view-', '');
    view.classList.toggle('active', id === name);
    view.classList.toggle('hidden', id !== name);
  }
  RENDERERS[name]?.();
}

function navigate(name) {
  if (`#${name}` !== location.hash) location.hash = name;
  else setView(name);
}

window.addEventListener('hashchange', () => {
  const name = location.hash.replace('#', '') || 'dashboard';
  setView(name);
});

document.querySelectorAll('.nav-item').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(el.dataset.view);
  });
});

// ---------- Topbar wiring ----------

async function refreshHeaderBadge() {
  try {
    const data = await fetchJson(withDays('/api/runs?limit=500'));
    const n = data.runs.length;
    $('#run-count-badge').textContent = `${n} run${n === 1 ? '' : 's'}`;
  } catch {
    $('#run-count-badge').textContent = '0 runs';
  }
}

function updateRangeLabel() {
  // The popover/label only exists in live mode; in static mode it has been
  // replaced with a snapshot pill, so guard every selector.
  const label = $('#time-range-label');
  if (label) label.textContent = RANGE_LABELS[state.days] ?? 'Last 7 days';
  document.querySelectorAll('.popover-item').forEach((b) => {
    b.classList.toggle('active', (b.dataset.days ?? '') === state.days);
  });
}

document.querySelectorAll('.popover-item').forEach((b) => {
  b.addEventListener('click', () => {
    state.days = b.dataset.days ?? '';
    state.cache = {};
    updateRangeLabel();
    $('#time-popover').removeAttribute('open');
    refreshHeaderBadge();
    if (state.view) RENDERERS[state.view]?.();
  });
});

// Click outside to close the popover (since <details> only closes on summary click)
document.addEventListener('click', (e) => {
  const pop = $('#time-popover');
  if (pop?.open && !pop.contains(e.target)) pop.removeAttribute('open');
});

$('#refresh-btn').addEventListener('click', () => {
  state.cache = {};
  refreshHeaderBadge();
  if (state.view) RENDERERS[state.view]?.();
  toast('Refreshed', 'success');
});

$('#reset-btn').addEventListener('click', async () => {
  if (!confirm('Delete every recorded run and test result? This cannot be undone.')) return;
  try {
    const res = await fetch('/api/runs', { method: 'DELETE' });
    if (!res.ok) throw new Error(`${res.status}`);
    state.cache = {};
    refreshHeaderBadge();
    if (state.view) RENDERERS[state.view]?.();
    toast('All run data cleared', 'success');
  } catch (e) {
    toast(`Reset failed: ${e.message}`, 'error');
  }
});

// ---------- Cached fetch ----------
async function getCached(key, urlBuilder) {
  if (state.cache[key]) return state.cache[key];
  const data = await fetchJson(urlBuilder(), state.abort?.signal);
  state.cache[key] = data;
  return data;
}

// ===================================================================
//  Dashboard view
// ===================================================================
async function renderDashboard() {
  const root = $('#view-dashboard');
  renderLoading(root);
  const renderId = state.renderId;
  try {
    const [summary, trends] = await Promise.all([
      getCached(`summary-${state.days}`, () => withDays('/api/summary')),
      getCached(`trends-${state.days}`, () => withDays('/api/trends?limit=30')),
    ]);
    if (renderId !== state.renderId) return;
    paintDashboard(root, summary, trends);
  } catch (err) {
    if (err.name === 'AbortError') return;
    renderError(root, err.message, renderDashboard);
  }
}

async function paintDashboard(root, summary, trends) {
  const latest = summary.latestRun;
  root.innerHTML = `
    <div class="kpis">
      <div>${kpi('Total runs', summary.totalRuns, { icon: ICONS.total })}</div>
      <div>${kpi(
        'Latest pass rate',
        `${latest ? latest.passRate : 0}%`,
        { color: latest && latest.passRate >= 80 ? 'success' : latest ? 'warning' : 'muted', icon: ICONS.pass },
      )}</div>
      <div>${kpi(
        'Latest failures',
        latest ? latest.failed : 0,
        { color: latest && latest.failed > 0 ? 'danger' : 'muted', icon: ICONS.fail },
      )}</div>
      <div>${kpi(
        'Latest duration',
        latest ? fmtDuration(latest.durationMs) : '—',
        { color: 'muted', icon: ICONS.flaky },
      )}</div>
    </div>
    ${
      trends.points.length === 0
        ? `<div class="card">${emptyState('No runs yet', 'Run npm test to populate the dashboard.')}</div>`
        : `
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>Pass rate trend</h3><span class="meta">${trends.points.length} run${trends.points.length === 1 ? '' : 's'}</span></div>
            <div class="chart-wrap"><canvas id="chart-passrate"></canvas></div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Pass / Fail / Skip per run</h3></div>
            <div class="chart-wrap"><canvas id="chart-stack"></canvas></div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>Run duration</h3><span class="meta">seconds</span></div>
            <div class="chart-wrap"><canvas id="chart-duration"></canvas></div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Latest run by suite</h3><span class="meta">passed / failed / skipped</span></div>
            <div class="chart-wrap"><canvas id="chart-suite"></canvas></div>
          </div>
        </div>
      `
    }
  `;

  if (trends.points.length === 0) return;

  const labels = trends.points.map((p) => `#${p.runId}`);
  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: '#f3f4f6' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: '#f3f4f6' }, suggestedMin: 0 },
    },
  };

  charts.passrate = new Chart($('#chart-passrate'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pass rate %',
          data: trends.points.map((p) => p.passRate),
          borderColor: COLORS.brand,
          backgroundColor: COLORS.brandSoftRgba,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: COLORS.brand,
        },
      ],
    },
    options: { ...lineOpts, scales: { ...lineOpts.scales, y: { ...lineOpts.scales.y, suggestedMax: 100 } } },
  });

  charts.stack = new Chart($('#chart-stack'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Passed', data: trends.points.map((p) => p.passed), backgroundColor: COLORS.green },
        { label: 'Failed', data: trends.points.map((p) => p.failed), backgroundColor: COLORS.red },
        { label: 'Skipped', data: trends.points.map((p) => p.skipped), backgroundColor: COLORS.muted },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#374151', boxWidth: 12, boxHeight: 12 } } },
      scales: {
        x: { stacked: true, ticks: { color: '#6b7280' }, grid: { color: '#f3f4f6' } },
        y: { stacked: true, ticks: { color: '#6b7280' }, grid: { color: '#f3f4f6' } },
      },
    },
  });

  charts.duration = new Chart($('#chart-duration'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Seconds',
          data: trends.points.map((p) => Math.round(p.durationMs / 100) / 10),
          borderColor: COLORS.blue,
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
        },
      ],
    },
    options: lineOpts,
  });

  if (latest) {
    try {
      const data = await fetchJson(`/api/by-suite?runId=${latest.id}`, state.abort?.signal);
      const suites = data.suites.slice(0, 15);
      charts.suite = new Chart($('#chart-suite'), {
        type: 'bar',
        data: {
          labels: suites.map((s) => s.suite || '(root)'),
          datasets: [
            { label: 'Passed', data: suites.map((s) => s.passed), backgroundColor: COLORS.green },
            { label: 'Failed', data: suites.map((s) => s.failed), backgroundColor: COLORS.red },
            { label: 'Skipped', data: suites.map((s) => s.skipped), backgroundColor: COLORS.muted },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#374151', boxWidth: 12, boxHeight: 12 } } },
          scales: {
            x: { stacked: true, ticks: { color: '#6b7280' }, grid: { color: '#f3f4f6' } },
            y: { stacked: true, ticks: { color: '#6b7280' }, grid: { display: false } },
          },
        },
      });
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }
}

// ===================================================================
//  Runs view
// ===================================================================
async function renderRuns() {
  const root = $('#view-runs');
  renderLoading(root);
  const renderId = state.renderId;
  try {
    const data = await getCached(`runs-summary-${state.days}`, () => withDays('/api/runs-summary'));
    if (renderId !== state.renderId) return;
    paintRuns(root, data);
  } catch (err) {
    if (err.name === 'AbortError') return;
    renderError(root, err.message, renderRuns);
  }
}

function paintRuns(root, data) {
  root.innerHTML = `
    <div class="kpis">
      <div>${kpi('Total', data.total, { icon: ICONS.total })}</div>
      <div>${kpi('Healthy (≥80%)', data.healthy, { color: 'success', icon: ICONS.pass })}</div>
      <div>${kpi('Needs Attention (<80%)', data.attention, {
        color: data.attention > 0 ? 'danger' : 'muted',
        icon: ICONS.fail,
      })}</div>
    </div>
    <div class="card">
      <div class="card-header">
        <div>
          <h3>Run History</h3>
          <div class="meta">All ${data.total} run${data.total === 1 ? '' : 's'} · ${RANGE_LABELS[state.days] ?? 'all time'}</div>
        </div>
        <div class="search">${ICONS.search}<input id="runs-search" placeholder="Search runs..." value="${escapeHtml(state.ui.runsSearch)}"/></div>
      </div>
      <div class="table-wrap" id="runs-table-wrap"></div>
    </div>
    <div id="run-detail-card" class="card hidden">
      <div class="card-header">
        <div>
          <h3 id="run-detail-title">Run</h3>
          <div class="meta" id="run-detail-meta"></div>
        </div>
        <button class="btn" id="run-detail-close" type="button">Close</button>
      </div>
      <div class="table-wrap" id="run-detail-tests"></div>
    </div>
  `;

  const wrap = $('#runs-table-wrap');
  const search = $('#runs-search');

  function paint() {
    const q = state.ui.runsSearch.toLowerCase();
    const rows = data.runs.filter((r) => {
      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        (r.branch ?? '').toLowerCase().includes(q) ||
        (r.commit ?? '').toLowerCase().includes(q) ||
        (r.project ?? '').toLowerCase().includes(q)
      );
    });
    if (rows.length === 0) {
      wrap.innerHTML = emptyState(
        data.runs.length === 0 ? 'No run history yet' : 'No runs match your search',
        data.runs.length === 0
          ? 'Run npm test and results will appear here.'
          : 'Try clearing the search or widening the time range.',
      );
      return;
    }
    wrap.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Run</th><th>Status</th><th>Branch</th><th>Commit</th>
            <th>Pass</th><th>Fail</th><th>Flaky</th><th>Pass rate</th>
            <th>Duration</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `<tr class="clickable" data-id="${r.id}">
                <td class="id">#${r.id}</td>
                <td>${statusBadge(r.failed === 0 ? 'passed' : 'failed')}</td>
                <td><span class="muted">${escapeHtml(r.branch ?? '—')}</span></td>
                <td><span class="mono">${escapeHtml((r.commit ?? '—').slice(0, 7))}</span></td>
                <td class="success-text">${r.passed}</td>
                <td class="${r.failed > 0 ? 'danger-text' : 'muted'}">${r.failed}</td>
                <td>${r.flaky}</td>
                <td>${r.passRate}%</td>
                <td>${fmtDuration(r.durationMs)}</td>
                <td class="muted">${fmtTime(r.startedAt)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
    wrap.querySelectorAll('tr.clickable').forEach((tr) =>
      tr.addEventListener('click', () => openRunDetail(Number(tr.dataset.id))),
    );
  }

  search.addEventListener('input', (e) => {
    state.ui.runsSearch = e.target.value;
    paint();
  });
  $('#run-detail-close').addEventListener('click', () => {
    $('#run-detail-card').classList.add('hidden');
  });

  paint();
}

async function openRunDetail(id) {
  const card = $('#run-detail-card');
  card.classList.remove('hidden');
  $('#run-detail-title').textContent = `Run #${id}`;
  $('#run-detail-meta').textContent = 'Loading…';
  $('#run-detail-tests').innerHTML = `<div class="state"><div class="spinner"></div></div>`;
  try {
    const data = await fetchJson(`/api/runs/${id}`, state.abort?.signal);
    $('#run-detail-meta').innerHTML = `
      Started ${fmtTime(data.run.startedAt)} · ${fmtDuration(data.run.durationMs)} ·
      pass rate ${data.run.passRate}% ·
      ${data.run.passed} passed, ${data.run.failed} failed, ${data.run.skipped} skipped
    `;
    $('#run-detail-tests').innerHTML = `
      <table class="table">
        <thead>
          <tr><th>Status</th><th>Suite</th><th>Title</th><th>File</th><th>Retries</th><th>Duration</th></tr>
        </thead>
        <tbody>
          ${data.tests
            .map(
              (t) => `<tr>
                <td>${statusBadge(t.status)}</td>
                <td>${escapeHtml(t.suite)}</td>
                <td>${escapeHtml(t.title)}</td>
                <td class="mono muted">${escapeHtml(t.file)}</td>
                <td>${t.retries}</td>
                <td>${fmtDuration(t.durationMs)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    if (e.name === 'AbortError') return;
    $('#run-detail-tests').innerHTML = emptyState('Could not load run', e.message, ICONS.fail);
  }
}

// ===================================================================
//  Tests view
// ===================================================================
async function renderTests() {
  const root = $('#view-tests');
  renderLoading(root);
  const renderId = state.renderId;
  try {
    const data = await getCached(`tests-${state.days}`, () => withDays('/api/tests-aggregated'));
    if (renderId !== state.renderId) return;
    paintTests(root, data);
  } catch (err) {
    if (err.name === 'AbortError') return;
    renderError(root, err.message, renderTests);
  }
}

function paintTests(root, data) {
  // file dropdown options are reset every render (innerHTML rewrite below) so
  // there's no risk of duplicates accumulating across renders/refreshes.
  const fileOptions = data.files
    .map((f) => `<option value="${escapeHtml(f)}" ${state.ui.testsFile === f ? 'selected' : ''}>${escapeHtml(f)}</option>`)
    .join('');

  root.innerHTML = `
    <div class="kpis">
      <div>${kpi('Total', data.total, { icon: ICONS.total })}</div>
      <div>${kpi('Passed', data.passed, { color: 'success', icon: ICONS.pass })}</div>
      <div>${kpi('Failed', data.failed, { color: data.failed > 0 ? 'danger' : 'muted', icon: ICONS.fail })}</div>
      <div>${kpi('Flaky', data.flaky, { color: data.flaky > 0 ? 'warning' : 'muted', icon: ICONS.flaky })}</div>
    </div>
    <div class="card">
      <div class="toolbar">
        <div class="toolbar-left">All Tests</div>
        <div class="toolbar-right">
          <div class="search">${ICONS.search}<input id="tests-search" placeholder="Search tests..." value="${escapeHtml(state.ui.testsSearch)}"/></div>
          <select class="select" id="tests-status">
            <option value="" ${state.ui.testsStatus === '' ? 'selected' : ''}>All Status</option>
            <option value="passed" ${state.ui.testsStatus === 'passed' ? 'selected' : ''}>Passed</option>
            <option value="failed" ${state.ui.testsStatus === 'failed' ? 'selected' : ''}>Failed</option>
            <option value="skipped" ${state.ui.testsStatus === 'skipped' ? 'selected' : ''}>Skipped</option>
            <option value="flaky" ${state.ui.testsStatus === 'flaky' ? 'selected' : ''}>Flaky</option>
          </select>
          <select class="select" id="tests-file">
            <option value="" ${state.ui.testsFile === '' ? 'selected' : ''}>All Files</option>
            ${fileOptions}
          </select>
        </div>
      </div>
      <div class="table-wrap" id="tests-table-wrap"></div>
    </div>
  `;

  const wrap = $('#tests-table-wrap');
  const search = $('#tests-search');
  const statusSel = $('#tests-status');
  const fileSel = $('#tests-file');

  function paint() {
    const q = state.ui.testsSearch.toLowerCase();
    const status = state.ui.testsStatus;
    const file = state.ui.testsFile;
    const { col, dir } = state.ui.testsSort;

    let tests = data.tests.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !t.file.toLowerCase().includes(q)) return false;
      if (status === 'flaky') {
        if (!(t.status === 'passed' && t.retries > 0)) return false;
      } else if (status && t.status !== status) return false;
      if (file && t.file !== file) return false;
      return true;
    });

    const sorters = {
      id: (a, b) => a.id.localeCompare(b.id),
      title: (a, b) => a.title.localeCompare(b.title),
      status: (a, b) => a.status.localeCompare(b.status),
      duration: (a, b) => a.durationMs - b.durationMs,
      retries: (a, b) => a.retries - b.retries,
      file: (a, b) => a.file.localeCompare(b.file),
    };
    if (sorters[col]) tests = [...tests].sort((a, b) => (dir === 'asc' ? 1 : -1) * sorters[col](a, b));

    if (tests.length === 0) {
      wrap.innerHTML = emptyState(
        data.tests.length === 0 ? 'No tests yet' : 'No tests match these filters',
        data.tests.length === 0
          ? 'Run npm test and results will appear here.'
          : 'Try clearing search/status/file filters.',
      );
      return;
    }

    const arrow = (c) =>
      col === c ? `<span class="arrow">${dir === 'asc' ? '▲' : '▼'}</span>` : `<span class="arrow">⇅</span>`;
    const sortClass = (c) => `sortable ${col === c ? dir : ''}`.trim();

    wrap.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th class="${sortClass('id')}" data-sort="id">ID ${arrow('id')}</th>
            <th class="${sortClass('title')}" data-sort="title">Test ${arrow('title')}</th>
            <th class="${sortClass('status')}" data-sort="status">Status ${arrow('status')}</th>
            <th class="${sortClass('duration')}" data-sort="duration">Duration ${arrow('duration')}</th>
            <th class="${sortClass('retries')}" data-sort="retries">Retries ${arrow('retries')}</th>
            <th>Error</th>
            <th class="${sortClass('file')}" data-sort="file">File ${arrow('file')}</th>
          </tr>
        </thead>
        <tbody>
          ${tests
            .map(
              (t) => `<tr>
                <td class="id">${t.id}</td>
                <td>
                  <div class="title-cell">
                    <div>${escapeHtml(t.title)}</div>
                    <div class="sub mono">${escapeHtml(t.file)}</div>
                  </div>
                </td>
                <td>${statusBadge(t.retries > 0 && t.status === 'passed' ? 'flaky' : t.status)}</td>
                <td>${fmtDuration(t.durationMs)}</td>
                <td>${t.retries}</td>
                <td class="${t.errorMessage ? 'danger-text' : 'muted'}">${
                  t.errorMessage ? escapeHtml(t.errorMessage.split('\n')[0]).slice(0, 80) : '—'
                }</td>
                <td class="mono muted">${escapeHtml(t.file)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;

    wrap.querySelectorAll('th.sortable').forEach((th) =>
      th.addEventListener('click', () => {
        const c = th.dataset.sort;
        if (state.ui.testsSort.col === c) {
          state.ui.testsSort.dir = state.ui.testsSort.dir === 'asc' ? 'desc' : 'asc';
        } else {
          state.ui.testsSort = { col: c, dir: 'asc' };
        }
        paint();
      }),
    );
  }

  search.addEventListener('input', (e) => { state.ui.testsSearch = e.target.value; paint(); });
  statusSel.addEventListener('change', (e) => { state.ui.testsStatus = e.target.value; paint(); });
  fileSel.addEventListener('change', (e) => { state.ui.testsFile = e.target.value; paint(); });
  paint();
}

// ===================================================================
//  Features view
// ===================================================================
async function renderFeatures() {
  const root = $('#view-features');
  renderLoading(root);
  const renderId = state.renderId;
  try {
    const data = await getCached(`features-${state.days}`, () => withDays('/api/features'));
    if (renderId !== state.renderId) return;
    paintFeatures(root, data);
  } catch (err) {
    if (err.name === 'AbortError') return;
    renderError(root, err.message, renderFeatures);
  }
}

function paintFeatures(root, data) {
  root.innerHTML = `
    <div class="tabs">
      <button class="tab-pill" data-tab="all" type="button">All <span class="count">${data.total}</span></button>
      <button class="tab-pill success" data-tab="healthy" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>
        Healthy <span class="count">${data.healthy}</span>
      </button>
      <button class="tab-pill warning" data-tab="attention" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Needs Attention <span class="count">${data.attention}</span>
      </button>
    </div>
    <div id="features-grid" class="feature-grid"></div>
  `;

  function paint(filter) {
    state.ui.featuresTab = filter;
    document.querySelectorAll('.tab-pill').forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === filter),
    );
    const list = data.features.filter((f) => {
      if (filter === 'healthy') return f.hasResults && f.passRate >= 80;
      if (filter === 'attention') return !f.hasResults || f.passRate < 80;
      return true;
    });
    const grid = $('#features-grid');
    if (list.length === 0) {
      grid.innerHTML = `<div class="card">${emptyState(
        'No features in this group',
        filter === 'healthy'
          ? 'Run more tests to add healthy features here.'
          : 'Everything is green — nothing needs attention.',
      )}</div>`;
      return;
    }
    grid.innerHTML = list.map(featureCard).join('');
  }

  document.querySelectorAll('.tab-pill').forEach((b) => {
    b.addEventListener('click', () => paint(b.dataset.tab));
  });
  paint(state.ui.featuresTab ?? 'all');
}

function featureCard(f) {
  const colorClass = !f.hasResults
    ? 'danger'
    : f.passRate >= 80
      ? 'success'
      : f.passRate >= 50
        ? 'warning'
        : 'danger';
  // One dot per executed test (green = passed, red = failed, amber = flaky,
  // grey = skipped). No placeholder padding — the dot count equals the test count
  // so 5 tests render 5 dots. If we hit the 30-dot cap, show a "+N" overflow chip.
  const dotsHtml =
    f.dots
      .map((s) => {
        const cls = s === 'passed' ? 'passed' : s === 'failed' ? 'failed' : 'skipped';
        return `<span class="dot ${cls}"></span>`;
      })
      .join('') +
    (f.dotOverflow > 0 ? `<span class="dot-overflow">+${f.dotOverflow}</span>` : '');
  return `<div class="feature-card">
    <div class="name">${escapeHtml(f.name)}</div>
    <div class="sub">${f.total} test${f.total === 1 ? '' : 's'} · ${escapeHtml(f.folder)}</div>
    <div class="pct ${colorClass}">${f.passRate || 0}<span class="small">%</span></div>
    <div class="stat-row passed">
      <span>Passed</span><span class="v">${f.passed} · ${
        f.total > 0 ? Math.round((f.passed / f.total) * 100) : 0
      }%</span>
    </div>
    <div class="stat-row failed"><span>Failed</span><span class="v">${f.failed}</span></div>
    <div class="stat-row bug"><span>Bug Tags</span><span class="v">${f.bugTags}</span></div>
    <div class="dots">${dotsHtml}</div>
  </div>`;
}

// ===================================================================
//  Coverage view
// ===================================================================
async function renderCoverage() {
  const root = $('#view-coverage');
  renderLoading(root);
  const renderId = state.renderId;
  try {
    const cov = await getCached('coverage', () => '/api/coverage');
    if (renderId !== state.renderId) return;
    paintCoverage(root, cov);
  } catch (err) {
    if (err.name === 'AbortError') return;
    renderError(root, err.message, renderCoverage);
  }
}

function paintCoverage(root, cov) {
  root.innerHTML = `
    <div class="kpis">
      <div>${kpi('Spec Files', cov.totalSpecFiles, { icon: ICONS.files })}</div>
      <div>${kpi('Test Cases', cov.totalTestCases, { color: 'muted', icon: ICONS.cases })}</div>
      <div>${kpi('Describe Blocks', cov.totalDescribeBlocks, { color: 'muted', icon: ICONS.describe })}</div>
      <div>${kpi('Bug Tags Found', cov.totalBugTags, {
        color: cov.totalBugTags > 0 ? 'danger' : 'muted',
        icon: ICONS.bug,
      })}</div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Coverage by Spec File</h3><span class="meta">test cases</span></div>
        <div class="bar-list" id="cov-by-file"></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Coverage by Folder</h3><span class="meta">tests per folder</span></div>
        <div class="donut-wrap">
          <div class="donut-canvas"><canvas id="chart-folder"></canvas></div>
          <div class="donut-legend" id="cov-folder-legend"></div>
          <div class="folder-list" id="cov-folder-list"></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Spec File Inventory</h3><span class="meta">${cov.totalSpecFiles} files</span></div>
      <div class="table-wrap" id="cov-inventory"></div>
    </div>
  `;

  const top = cov.byFile.slice(0, 10);
  const max = top[0]?.testCases || 1;
  $('#cov-by-file').innerHTML = top
    .map((f) => {
      const w = (f.testCases / max) * 100;
      const name = f.file.replace(/\.spec\.(ts|tsx|js)$/, '').split('/').pop();
      return `<div class="bar-row">
        <div>
          <div class="bar-label">${escapeHtml(name)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
        </div>
        <div class="bar-value">${f.testCases}</div>
      </div>`;
    })
    .join('');

  const labels = cov.byFolder.map((f) => f.folder);
  const values = cov.byFolder.map((f) => f.testCases);
  const colors = cov.byFolder.map((_, i) => COLORS.donut[i % COLORS.donut.length]);
  if (values.length > 0) {
    charts.folder = new Chart($('#chart-folder'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { display: false } } },
    });
  }

  $('#cov-folder-legend').innerHTML = labels
    .map(
      (l, i) =>
        `<span><span class="swatch" style="background:${colors[i]}"></span>${escapeHtml(l)}</span>`,
    )
    .join('');

  $('#cov-folder-list').innerHTML = cov.byFolder
    .map(
      (f) => `<div class="row">
        <span>${escapeHtml(f.folder)}</span>
        <span class="meta">${f.testCases} tests · ${f.files} file${f.files === 1 ? '' : 's'}</span>
      </div>`,
    )
    .join('');

  $('#cov-inventory').innerHTML = `
    <table class="table">
      <thead>
        <tr><th>File</th><th>Folder</th><th>Test Cases</th><th>Describe Blocks</th><th>Bug Tags</th><th>Size</th></tr>
      </thead>
      <tbody>
        ${cov.byFile
          .map(
            (f) => `<tr>
              <td>${escapeHtml(f.file.replace(/\.spec\.(ts|tsx|js)$/, '').split('/').pop())}</td>
              <td><span class="muted">${escapeHtml(f.folder)}</span></td>
              <td><span style="color:var(--accent);font-weight:600">${f.testCases}</span></td>
              <td>${f.describeBlocks}</td>
              <td class="${f.bugTags > 0 ? 'danger-text' : 'muted'}">${f.bugTags}</td>
              <td class="muted">${fmtSize(f.sizeBytes)}</td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

// ===================================================================
//  Triage view
// ===================================================================
async function renderTriage() {
  const root = $('#view-triage');
  renderLoading(root);
  const renderId = state.renderId;
  try {
    const data = await getCached(`triage-${state.days}`, () => withDays('/api/triage'));
    if (renderId !== state.renderId) return;
    paintTriage(root, data);
  } catch (err) {
    if (err.name === 'AbortError') return;
    renderError(root, err.message, renderTriage);
  }
}

function paintTriage(root, data) {
  root.innerHTML = `
    <div class="kpis">
      <div>${kpi('Needs Attention', data.attention, {
        color: data.attention > 0 ? 'danger' : 'muted',
        icon: ICONS.fail,
      })}</div>
      <div>${kpi('Failed', data.failed, { color: data.failed > 0 ? 'danger' : 'muted', icon: ICONS.fail })}</div>
      <div>${kpi('Flaky', data.flaky, { color: data.flaky > 0 ? 'warning' : 'muted', icon: ICONS.flaky })}</div>
    </div>
    <div class="triage-grid">
      <div class="triage-list">
        <div class="card-header" style="margin-bottom:8px">
          <h3>Tests Needing Attention</h3>
          <div class="search">${ICONS.search}<input id="triage-search" placeholder="Search..." value="${escapeHtml(state.ui.triageSearch)}"/></div>
        </div>
        <div id="triage-rows"></div>
      </div>
      <div class="triage-detail empty-state" id="triage-detail">
        <div class="icon">${ICONS.search}</div>
        <div class="title">Select a test to see details</div>
      </div>
    </div>
  `;

  const rows = $('#triage-rows');
  const search = $('#triage-search');
  const detail = $('#triage-detail');

  function paint() {
    const q = state.ui.triageSearch.toLowerCase();
    const items = data.items.filter(
      (it) => !q || it.title.toLowerCase().includes(q) || it.file.toLowerCase().includes(q),
    );

    if (items.length === 0) {
      rows.innerHTML = emptyState(
        data.items.length === 0 ? 'All green' : 'No matches',
        data.items.length === 0
          ? 'No failing or flaky tests in the selected range.'
          : 'Try clearing the search.',
        ICONS.pass,
      );
      return;
    }

    rows.innerHTML = items
      .map(
        (it) => `<div class="row" data-id="${it.id}">
        <input type="checkbox" class="checkbox"/>
        <div class="info">
          <div class="title">${escapeHtml(it.title)}</div>
          <div class="file">${escapeHtml(it.file)}</div>
        </div>
        ${statusBadge(it.status)}
      </div>`,
      )
      .join('');
    rows.querySelectorAll('.row').forEach((el) =>
      el.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const id = Number(el.dataset.id);
        const item = items.find((x) => x.id === id);
        rows.querySelectorAll('.row').forEach((r) => r.classList.toggle('active', r === el));
        showDetail(item);
      }),
    );
  }

  function showDetail(item) {
    detail.classList.remove('empty-state');
    state.ui.triageSelected = item.id;
    // Artifacts (trace.zip / screenshots / video) are served by the live Express
    // backend from disk. In static mode they aren't bundled into the export, so
    // render them as a disabled note instead of dead links.
    const attachments = (item.attachments ?? []).filter((a) => a.path);
    const attHtml = IS_STATIC.value
      ? attachments.length
        ? `<span class="muted">${attachments.length} artifact${attachments.length === 1 ? '' : 's'} — only available in live dashboard</span>`
        : '<span class="muted">none</span>'
      : attachments
          .map((a) => `<a href="/artifacts/${encodeURI(a.path)}" target="_blank" rel="noopener">${escapeHtml(a.name)}</a>`)
          .join(' ') || '<span class="muted">none</span>';
    detail.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <div class="meta">
        ${escapeHtml(item.file)} · ${item.suite ? escapeHtml(item.suite) + ' · ' : ''}retries ${item.retries} · ${fmtDuration(item.durationMs)}
        · ${statusBadge(item.status)}
      </div>
      <div style="font-weight:600;margin-top:6px">Error</div>
      <pre>${escapeHtml(item.errorMessage ?? '(no error message)')}</pre>
      <div class="attachments"><strong>Attachments:</strong> ${attHtml}</div>
    `;
  }

  search.addEventListener('input', (e) => {
    state.ui.triageSearch = e.target.value;
    paint();
  });
  paint();

  if (state.ui.triageSelected) {
    const item = data.items.find((x) => x.id === state.ui.triageSelected);
    if (item) {
      const row = rows.querySelector(`[data-id="${item.id}"]`);
      if (row) row.classList.add('active');
      showDetail(item);
    }
  }
}

// ---------- Wire up ----------
const RENDERERS = {
  dashboard: renderDashboard,
  runs: renderRuns,
  tests: renderTests,
  features: renderFeatures,
  coverage: renderCoverage,
  triage: renderTriage,
};

function applyStaticModeUI() {
  if (!IS_STATIC.value) return;
  // Reset/Refresh require a live backend
  $('#reset-btn')?.classList.add('hidden');
  $('#refresh-btn')?.classList.add('hidden');
  // Replace the time-range popover with a static "snapshot" badge
  const popover = $('#time-popover');
  if (popover) {
    const built = IS_STATIC.manifest?.builtAt
      ? new Date(IS_STATIC.manifest.builtAt).toLocaleString()
      : 'snapshot';
    const badge = document.createElement('div');
    badge.className = 'filter-pill';
    badge.style.cursor = 'default';
    badge.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>Static snapshot</span>
      <span class="filter-badge" id="run-count-badge">0 runs</span>
      <span class="muted" style="font-size:11px;margin-left:4px">${built}</span>
    `;
    popover.replaceWith(badge);
  }
}

(async function init() {
  await detectMode();
  applyStaticModeUI();
  updateRangeLabel();
  await refreshHeaderBadge();
  const initial = location.hash.replace('#', '') || 'dashboard';
  setView(initial);
})();
