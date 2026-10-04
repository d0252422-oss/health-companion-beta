const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const ux = require('../scripts/core-ux-contract.js');

function performanceRangeUI() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nodes = { 'performance-title': { textContent: '健康績效' }, 'perf-sets-label': { textContent: '訓練組數' } };
  const customOption = { textContent: '自訂日期' };
  const select = { value: '', querySelector: () => customOption };
  const context = vm.createContext({
    globalDateRange: { preset: '30d' }, DATA_SECTIONS: ['body', 'training'], sectionWindows: {},
    document: { getElementById: id => id === 'global-range' ? select : nodes[id] },
    resolveDateRange: (_, range) => ({ startDate: range.startDate || '2026-09-05', endDate: range.endDate || '2026-10-04' }),
    formatDateRange: range => `${range.startDate} – ${range.endDate}`,
    setValue: (id, value) => { nodes[id].textContent = value; },
  });
  const source = html.match(/    function syncDateRangeUI\(\)[\s\S]*?(?=\n    function restoreGlobalDateRangeFromLocation)/)[0];
  vm.runInContext(source, context);
  return { nodes, select, context, sync(range) { context.globalDateRange = range; vm.runInContext('syncDateRangeUI()', context); } };
}

for (const [preset, label] of [['7d', '7 日內'], ['30d', '30 日內'], ['90d', '90 日內'], ['year', '今年'], ['custom', '自訂期間']]) {
  test(`performance titles follow the selected ${preset} range without claiming this week`, () => {
    const ui = performanceRangeUI();
    ui.sync({ preset, startDate: '2026-09-05', endDate: '2026-10-04' });
    assert.equal(ui.nodes['performance-title'].textContent, `${label}健康績效`);
    assert.equal(ui.nodes['perf-sets-label'].textContent, `${label}訓練組數`);
    assert.equal(ui.select.value, preset);
    assert.equal(ui.context.sectionWindows.training.start, '2026-09-05');
  });
}

test('switching the range updates both labels immediately, without waiting for an API', () => {
  const ui = performanceRangeUI();
  for (const [preset, label] of [['30d', '30 日內'], ['7d', '7 日內'], ['custom', '自訂期間'], ['30d', '30 日內']]) {
    ui.sync({ preset });
    assert.equal(ui.nodes['performance-title'].textContent, `${label}健康績效`);
    assert.equal(ui.nodes['perf-sets-label'].textContent, `${label}訓練組數`);
  }
});

test('performance HTML has neutral initial titles; the separate weekly report stays weekly', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /id="performance-title"[^>]*>健康績效</);
  assert.match(html, /id="perf-sets-label"[^>]*>訓練組數</);
  assert.match(html, /id="report-period"[^>]*>本週健康摘要</);
  assert.match(html, /syncDateRangeUI\(\);updatePageHeader\(\)/);
});

test('LINE external login stays on the Beta route and preserves the existing link handshake', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const externalUrl = html.match(/EXTERNAL_APP_URL:"([^"]+)"/)[1];
  const source = html.match(/    function externalGoogleUrl\(\)[^\n]+/)[0];
  for (const linkCode of ['', 'synthetic+link/code=']) {
    const context = vm.createContext({ URL, CONFIG: { EXTERNAL_APP_URL: externalUrl }, pendingLineLinkCode: linkCode });
    vm.runInContext(source, context);
    const url = new URL(vm.runInContext('externalGoogleUrl()', context));
    assert.equal(url.origin, 'https://d0252422-oss.github.io');
    assert.equal(url.pathname, '/health-companion-beta/');
    assert.equal(url.searchParams.get('source'), 'line');
    assert.equal(url.searchParams.get('auth'), 'google-external-v7');
    assert.equal(url.searchParams.get('lineLinkCode'), linkCode || null);
  }
});

test('one failed analysis day does not hide a later day with steps and score', () => {
  const rows = [
    { date: '2026-09-27', healthStaleReason: 'RECOMPUTE_FAILED' },
    { date: '2026-09-28', healthStaleReason: 'RECOMPUTE_FAILED' },
    { date: '2026-09-29', steps: 5649, healthScore: 72 },
  ];
  assert.equal(ux.timelineReadState(rows, { date: '2026-10-02', healthStatus: 'NO_DATA' }), 'partial');
});

test('a failed range without any usable metric remains an error', () => {
  assert.equal(ux.timelineReadState([{ date: '2026-09-27', healthStaleReason: 'RECOMPUTE_FAILED' }]), 'error');
});

test('a healthy range remains ready', () => {
  assert.equal(ux.timelineReadState([{ date: '2026-09-29', steps: 5649 }]), 'ready');
});

test('stale score analysis preserves the available metric summary', () => {
  const rows = [
    { date: '2026-09-29', sleepHours: 6.5, steps: 3644, caloriesIntake: 1800 },
    { date: '2026-10-03', healthStatus: 'STALE', trainingSets: 4 },
  ];
  assert.equal(ux.timelineReadState(rows), 'partial');
  assert.deepEqual(ux.latestSummaryMetric(rows, 'sleepHours', '2026-10-03'), { date: '2026-09-29', value: 6.5 });
  assert.deepEqual(ux.latestSummaryMetric(rows, 'trainingSets', '2026-10-03'), { date: '2026-10-03', value: 4 });
  assert.equal(ux.latestSummaryMetric(rows, 'sleepHours', '2026-09-28'), null);
  assert.equal(ux.latestSummaryMetric(rows, 'recoveryScore', '2026-10-03'), null);
});

test('training days are counted by Asia/Taipei date, not session count', () => {
  const rows = [
    { date: '2026-10-01', trainingSessions: 2, trainingSets: 12 },
    { date: '2026-10-01', trainingSessions: 1, trainingSets: 3 },
    { date: '2026-10-02', trainingSessions: 1 },
    { date: '2026-10-03', trainingSessions: 0, trainingSets: 0 },
    { date: '2026-10-03', trainingSessions: 1, deleted: true },
    { date: '2026-10-04', trainingSessions: 1 },
  ];
  assert.equal(ux.trainingDayCount(rows, '2026-10-03'), 2);
});

test('chart connects only actual values across null dates and trends over those values', () => {
  const trend = ux.linearTrend([10.3, null, 6.5, null, 6.6, 5.6, null]);
  assert.ok(trend);
  assert.equal(trend.startIndex, 0);
  assert.equal(trend.endIndex, 5);
  assert.ok(trend.startValue > trend.endValue);
  assert.equal(ux.linearTrend([null, 5.6, null]), null);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /visiblePoints=points\.filter\(point=>point\.y!==null\)/);
  assert.match(html, /class="trend-trendline"/);
  assert.match(html, /class="trend-no-data"/);
});

test('summary distinguishes unscored dimensions from saved raw metrics', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const id of ['summary-sleep', 'summary-steps', 'summary-training', 'summary-nutrition']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /今天的健康分數尚未產生/);
  assert.match(html, /今日分析未完成/);
  assert.match(html, /trainingDayCount\(timeline,summaryDate\)/);
});

test('a failed analysis day keeps a later sleep value readable', () => {
  const rows = [
    { date: '2026-09-27', sleepStaleReason: 'RECOMPUTE_FAILED' },
    { date: '2026-10-02', sleepHours: 335 / 60, sleepDataStatus: 'CURRENT' },
  ];
  assert.equal(ux.metricReadState('sleepHours', rows), 'partial');
  assert.equal(ux.metricReadState('sleepHours', rows.slice(0, 1)), 'error');
});

test('all metric domains retain values when their analysis fails', () => {
  const cases = [
    ['steps', 'activityStaleReason', 3644],
    ['caloriesBurned', 'activityStaleReason', 1923],
    ['spo2', 'activityStaleReason', 97],
    ['caloriesIntake', 'nutritionStaleReason', 1800],
    ['healthScore', 'healthStaleReason', 72],
  ];
  for (const [metric, reason, value] of cases) {
    assert.equal(ux.metricReadState(metric, [
      { date: '2026-09-27', [reason]: 'RECOMPUTE_FAILED' },
      { date: '2026-10-02', [metric]: value },
    ]), 'partial', metric);
    assert.equal(ux.metricReadState(metric, [{ date: '2026-10-02', [metric]: value, [reason]: 'RECOMPUTE_FAILED' }]), 'partial', `${metric} same day`);
  }
});

test('unrelated score failures do not turn a readable sleep metric into an error', () => {
  assert.equal(ux.metricReadState('sleepHours', [
    { date: '2026-09-27', healthStaleReason: 'RECOMPUTE_FAILED' },
    { date: '2026-10-02', sleepHours: 5.6 },
  ]), 'ready');
});

test('a failed day outside the selected range does not contaminate another period', () => {
  const rows = [
    { date: '2026-09-27', sleepStaleReason: 'RECOMPUTE_FAILED' },
    { date: '2026-10-02', sleepHours: 5.6 },
  ];
  assert.equal(ux.metricReadState('sleepHours', rows, 'ready', { start: '2026-09-30', end: '2026-10-03' }), 'ready');
  assert.equal(ux.metricReadState('sleepHours', rows, 'ready', { start: '2026-09-27', end: '2026-10-03' }), 'partial');
});

test('saved nutrition remains readable when only the health score recompute fails', () => {
  const rows = [{ date: '2026-10-02', healthStaleReason: 'RECOMPUTE_FAILED', caloriesIntake: 1800 }];
  assert.equal(ux.nutritionReadState([], rows, '2026-10-02'), 'ready');
  assert.equal(ux.nutritionReadState([], [{ date: '2026-10-02', healthStaleReason: 'RECOMPUTE_FAILED' }], '2026-10-02'), 'empty');
});

test('failed nutrition projection retains existing values with a partial warning', () => {
  const rows = [{ date: '2026-10-02', caloriesIntake: 1800, nutritionStaleReason: 'RECOMPUTE_FAILED' }];
  assert.equal(ux.nutritionReadState([], rows, '2026-10-02'), 'partial');
  assert.equal(ux.nutritionReadState([], [{ date: '2026-10-02', nutritionStaleReason: 'RECOMPUTE_FAILED' }], '2026-10-02'), 'error');
});

test('metric detail page renders partial state instead of a whole-page error', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const stateScript = fs.readFileSync(path.join(root, 'scripts/web-view-state.js'), 'utf8');
  assert.match(html, /\["loading","updating","error","partial"\]\.includes\(detailState\)/);
  assert.match(html, /metricReadState\(config\.metric,appState\.healthTimeline,dashboardState,range\)/);
  assert.match(stateScript, /partial:'部分日期的分析更新失敗/);
});

test('public build markers and partial warning stay in sync', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'build.json'), 'utf8'));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const buildScript = fs.readFileSync(path.join(root, 'scripts/build-version.js'), 'utf8');
  assert.ok(html.includes(`name="health-companion-build" content="${manifest.buildId}"`));
  assert.ok(buildScript.includes(`const BUILD_ID = '${manifest.buildId}'`));
  assert.ok(html.includes('data-state="partial"'));
  assert.ok(html.includes('部分日期的健康分析未完成；已顯示可用的健康資料。'));
  assert.ok(!html.includes('20260926-health-state-resilience-06'));
});

test('public page inline JavaScript parses', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(inlineScripts.length > 0);
  inlineScripts.forEach((match, index) => new vm.Script(match[1], { filename: `index-inline-${index}.js` }));
});
