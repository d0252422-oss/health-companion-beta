const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const ux = require('../scripts/core-ux-contract.js');

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

test('public build markers and partial warning stay in sync', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'build.json'), 'utf8'));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const buildScript = fs.readFileSync(path.join(root, 'scripts/build-version.js'), 'utf8');
  assert.ok(html.includes(`name="health-companion-build" content="${manifest.buildId}"`));
  assert.ok(buildScript.includes(`const BUILD_ID = '${manifest.buildId}'`));
  assert.ok(html.includes('data-state="partial"'));
  assert.ok(html.includes('部分日期的健康分析更新失敗；已顯示可用的健康資料。'));
  assert.ok(!html.includes('20260926-health-state-resilience-06'));
});

test('public page inline JavaScript parses', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(inlineScripts.length > 0);
  inlineScripts.forEach((match, index) => new vm.Script(match[1], { filename: `index-inline-${index}.js` }));
});
