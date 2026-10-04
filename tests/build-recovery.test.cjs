const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const build = require('../scripts/build-version.js');

function options(overrides = {}) {
  const replaced = [], values = new Map();
  return {
    expectedBuildId: 'new-build', loadedBuildId: 'old-html',
    location: { href: 'https://example.test/beta/?view=dashboard#training', replace: url => replaced.push(url) },
    storage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) },
    fetchImpl: async () => ({ ok: true, json: async () => ({ buildId: 'new-build' }) }),
    onUpdateRequired: () => {}, replaced, values, ...overrides,
  };
}

test('new build script with stale HTML must recover, not claim the page is current', async () => {
  const o = options();
  const result = await build.checkLiveBuild(o);
  assert.equal(result.liffLoadedBuildId, 'old-html');
  assert.equal(result.recovery, 'ONE_TIME_RELOAD');
  assert.equal(o.replaced.length, 1);
  assert.equal(new URL(o.replaced[0]).searchParams.get('view'), 'dashboard');
  assert.equal(new URL(o.replaced[0]).hash, '#training');
});

test('blocked session storage cannot prevent detection or create a reload loop', async () => {
  const notices = [];
  const o = options({ storage: { getItem() { throw Error('SecurityError'); }, setItem() { throw Error('SecurityError'); } },
    onUpdateRequired: info => notices.push(info) });
  const result = await build.checkLiveBuild(o);
  assert.equal(result.liveDeployedBuildId, 'new-build');
  assert.equal(result.recovery, 'UPDATE_REQUIRED');
  assert.equal(notices.length, 1);
  assert.equal(o.replaced.length, 0);
});

test('stale page after one attempted reload must expose an update action', async () => {
  const notices = [], o = options({ onUpdateRequired: info => notices.push(info) });
  o.values.set('healthCompanionBuildRecovery:new-build', 'new-build');
  const result = await build.checkLiveBuild(o);
  assert.equal(result.recovery, 'UPDATE_REQUIRED');
  assert.equal(o.replaced.length, 0);
  assert.equal(notices[0].liveBuildId, 'new-build');
});

test('a current HTML and script do not reload', async () => {
  const o = options({ loadedBuildId: 'new-build' });
  assert.equal((await build.checkLiveBuild(o)).recovery, 'NOT_REQUIRED');
  assert.equal(o.replaced.length, 0);
});

test('a manifest failure preserves the app and reports unavailable check', async () => {
  const o = options({ fetchImpl: async () => ({ ok: false, status: 503 }) });
  assert.equal((await build.checkLiveBuild(o)).recovery, 'CHECK_UNAVAILABLE');
  assert.equal(o.replaced.length, 0);
});

test('current HTML with an old build script also requires recovery', async () => {
  const o = options({ expectedBuildId: 'old-script', loadedBuildId: 'new-build' });
  assert.equal((await build.checkLiveBuild(o)).recovery, 'ONE_TIME_RELOAD');
});

test('resume checks show an action without automatic navigation or losing edits', async () => {
  const notices = [], o = options({ autoReload: false, onUpdateRequired: info => notices.push(info) });
  assert.equal((await build.checkLiveBuild(o)).recovery, 'UPDATE_REQUIRED');
  assert.equal(o.replaced.length, 0);
  assert.equal(notices.length, 1);
});

test('failed or silently discarded reload marker never causes automatic reload', async () => {
  for (const storage of [
    { getItem: () => '', setItem() { throw Error('QuotaExceededError'); } },
    { getItem: () => '', setItem() {} },
  ]) {
    const o = options({ storage });
    assert.equal((await build.checkLiveBuild(o)).recovery, 'UPDATE_REQUIRED');
    assert.equal(o.replaced.length, 0);
  }
});

test('invalid manifests cannot become navigation targets', async () => {
  const o = options({ fetchImpl: async () => ({ ok: true, json: async () => ({ buildId: '<script>' }) }) });
  assert.equal((await build.checkLiveBuild(o)).recovery, 'CHECK_UNAVAILABLE');
  assert.equal(o.replaced.length, 0);
});

test('real DOM fallback reads HTML marker and exposes a safe update button', async () => {
  const nodes = [], listeners = {}, navigations = [];
  const node = tag => ({ tag, children: [], style: {}, setAttribute(key, value) { this[key] = value; },
    append(...children) { this.children.push(...children); }, querySelector() { return this.children.find(n => n.tag === 'button'); } });
  const document = {
    visibilityState: 'visible',
    querySelector: () => ({ getAttribute: () => 'old-html' }),
    getElementById: id => nodes.find(n => n.id === id),
    createElement: node, body: { appendChild: n => nodes.push(n) },
    addEventListener: (event, handler) => { listeners[event] = handler; },
  };
  const context = { document, URL, Date, module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../scripts/build-version.js'), 'utf8'), context);
  const o = options({ loadedBuildId: undefined, storage: { getItem: () => 'new-build' },
    location: { href: 'https://example.test/beta/?view=dashboard#training', replace: url => navigations.push(url) },
    onUpdateRequired: undefined });
  const result = await context.module.exports.checkLiveBuild(o);
  assert.equal(result.liffLoadedBuildId, 'old-html');
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].role, 'status');
  assert.equal(nodes[0].querySelector('button').textContent, '更新頁面');
  nodes[0].querySelector('button').onclick();
  const url = new URL(navigations[0]);
  assert.equal(url.origin, 'https://example.test');
  assert.equal(url.pathname, '/beta/');
  assert.equal(url.searchParams.get('v'), 'new-build');
  assert.ok(url.searchParams.get('buildRefresh'));
  assert.equal(url.searchParams.get('view'), 'dashboard');
  assert.equal(url.hash, '#training');
  await context.module.exports.checkLiveBuild(o);
  assert.equal(nodes.length, 1, 'reuse the notice rather than stacking it');
});
