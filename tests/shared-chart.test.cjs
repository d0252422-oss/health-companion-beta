const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ux = require('../scripts/core-ux-contract.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function inlineFunction(name) {
  const start = html.indexOf(`    function ${name}(`);
  assert.ok(start !== -1, `production function ${name} exists`);
  return html.slice(start, html.indexOf('\n    function ', start + 1));
}
function render(metric, values, selectedIndex = values.length - 1) {
  const rows = values.map((value, index) => Object.freeze({ date: `2026-10-${String(index + 1).padStart(2, '0')}`, [metric]: value }));
  Object.freeze(rows);
  const context = vm.createContext({
    HealthCoreUX: ux,
    metricConfig: () => ({ label: metric, color: '#20c997' }),
    latestTimelineValue: () => ({ value: values.filter(value => value != null).at(-1) ?? null }),
    metricDisplay: (_metric, value) => value === null ? '—' : String(value),
    escapeHtml: value => String(value),
    longDateLabel: date => date,
    shortDateLabel: date => date,
    rows, metric, selectedIndex,
  });
  for (const name of ['valid', 'num', 'metricRange', 'sharedSegments', 'renderSharedPanel']) {
    vm.runInContext(inlineFunction(name), context);
  }
  return vm.runInContext('renderSharedPanel(metric, rows, selectedIndex)', context);
}

for (const metric of ['sleepHours', 'weight', 'bodyFatPercentage', 'steps', 'caloriesBurned', 'spo2']) {
  test(`${metric}: shared chart bridges real points without filling null dates`, () => {
    const result = render(metric, [10.3, null, 6.5, null, 6.6, 5.6, null]);
    const lines = [...result.matchAll(/<polyline class="shared-line" points="([^"]+)"/g)];
    assert.equal(lines.length, 1);
    const points = lines[0][1].split(' ').map(pair => pair.split(',').map(Number));
    assert.equal(points.length, 4);
    assert.deepEqual(points.map(point => point[0]), [18, 208, 398, 493]);
    assert.equal((result.match(/<circle /g) || []).length, 4);
    assert.match(result, /class="shared-trendline"/);
    assert.match(result, /<b>—<\/b>/);
    assert.match(result, /所選日期尚無紀錄/);
    assert.match(result, new RegExp(`aria-valuetext="2026-10-07，${metric} —"`));
    assert.doesNotMatch(result, /NaN|Infinity/);
  });
}

test('shared trend uses original date positions and valid-point regression', () => {
  const values = [null, 8, null, 6, 10, null];
  const trend = ux.linearTrend(values);
  const result = render('sleepHours', values);
  const line = result.match(/<line class="shared-trendline"[^>]+>/)[0];
  assert.match(line, new RegExp(`x1="${18 + trend.startIndex * 570 / 5}"`));
  assert.match(line, new RegExp(`x2="${18 + trend.endIndex * 570 / 5}"`));
  assert.match(line, /stroke-dasharray="5 4"/);
  assert.match(result, /依有效資料計算的線性趨勢/);
  for (const [, value] of line.matchAll(/\by[12]="([^"]+)"/g)) {
    assert.ok(Number(value) >= 12 && Number(value) <= 102, 'trend remains inside plot');
  }
});

test('trend endpoints outside raw bounds remain visible without new observations', () => {
  const result = render('steps', [0, 0, 0, 100]);
  const line = result.match(/<line class="shared-trendline"[^>]+>/)[0];
  for (const [, value] of line.matchAll(/\by[12]="([^"]+)"/g)) {
    assert.ok(Number(value) >= 12 && Number(value) <= 102);
  }
  assert.equal((result.match(/<circle /g) || []).length, 4);
});

test('empty and singleton shared charts do not invent a line or trend', () => {
  for (const values of [[], [null, null], [null, 5.6, null]]) {
    const result = render('sleepHours', values);
    assert.doesNotMatch(result, /class="shared-line"|class="shared-trendline"/);
    assert.doesNotMatch(result, /NaN|Infinity/);
    assert.match(result, /<b>—<\/b>/);
  }
});

test('observed zero is retained while absent and invalid values remain missing', () => {
  const result = render('steps', [0, undefined, '', NaN, null, 0], 0);
  assert.equal((result.match(/<circle /g) || []).length, 2);
  assert.match(result, /<b>0<\/b>/);
  assert.match(result, /class="shared-line"/);
  assert.match(result, /class="shared-trendline"/);
  assert.doesNotMatch(result, /NaN|Infinity/);
});
