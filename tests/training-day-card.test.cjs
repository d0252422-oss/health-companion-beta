const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ux = require('../scripts/core-ux-contract.js');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function card(timeline) {
  const line = html.split(/\r?\n/).find(line => line.includes('const hasWorkoutSetData=') && line.includes('kpi-training-detail'));
  assert.ok(line);
  const captured = [];
  vm.runInNewContext(line, { timeline, sets: timeline.map(row => row.trainingSets), summaryDate: '2026-10-04',
    HealthCoreUX: ux, num: value => value == null ? null : Number(value), updateKpi: (...args) => captured.push(args) });
  return captured[0];
}
test('actual training KPI: 88 sets / 18 sessions over four dates = four training days', () => {
  const result = card([5, 5, 4, 4].map((sessions, i) => ({ date: `2026-10-0${i + 1}`, trainingSets: 22, trainingSessions: sessions })));
  assert.equal(result[1], '88 組');
  assert.equal(result[2].text, '4 個訓練日');
});
test('training day count uses Taipei dates, not UTC dates or number of sessions', () => {
  assert.equal(ux.trainingDayCount([
    { recorded_at: '2026-10-01T15:59:00Z', trainingSessions: 2 },
    { recorded_at: '2026-10-01T16:01:00Z', trainingSessions: 4 },
    { recorded_at: '2026-10-02T08:00:00Z', trainingSets: 8 },
    { date: '2026-10-03', trainingSessions: 1, deleted: true },
    { date: '2026-10-03', trainingSessions: 1, valid: false },
  ], '2026-10-04'), 2);
});
test('a missing training source is not shown as zero days', () => {
  const result = card([{ date: '2026-10-04', trainingSets: null, trainingSessions: null }]);
  assert.equal(result[1], '—');
  assert.equal(result[2].text, '尚無訓練資料');
});
