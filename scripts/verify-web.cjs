'use strict';
// Static Beta build: no backend calls, credentials, dependencies or generated health data.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const REPOSITORY = 'd0252422-oss/health-companion-beta';
const PRIVATE = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}|\bAKIA[A-Z0-9]{16}|\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}/;
function scan(name, text) {
  assert.ok(!/(^|\/)(?:\.env(?:\.|$)|node_modules\/)|\.(?:pem|p12|key)$/.test(name), `disallowed release path: ${name}`);
  assert.ok(!text.includes('\0'), `binary file: ${name}`);
  assert.ok(!PRIVATE.test(text), `credential pattern: ${name}`);
  // Public anon/publishable keys are permitted; privileged JWT roles are not.
  for (const token of text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || []) {
    let body;
    try { body = JSON.parse(Buffer.from(token.split('.')[1], 'base64url')); } catch { continue; }
    assert.ok(!['service_role', 'supabase_admin'].includes(body.role), `privileged token: ${name}`);
  }
}
function verify(root, repository = REPOSITORY) {
  assert.equal(repository, REPOSITORY, 'Beta repository only');
  const files = cp.execFileSync('git', ['-C', root, 'ls-files', '-z']).toString().split('\0').filter(Boolean);
  for (const name of files) scan(name, fs.readFileSync(path.join(root, name), 'utf8'));
  const read = name => fs.readFileSync(path.join(root, name), 'utf8');
  assert.ok(fs.existsSync(path.join(root, '.nojekyll')));
  const build = JSON.parse(read('build.json')).buildId;
  assert.match(build, /^\d{8}-beta-[a-z0-9-]+$/);
  const html = read('index.html');
  assert.ok(html.includes(`name="health-companion-build" content="${build}"`));
  const context = { module: { exports: {} } };
  vm.runInNewContext(read('scripts/build-version.js'), context, { timeout: 1000 });
  assert.equal(context.module.exports.BUILD_ID, build);
  const config = {};
  vm.runInNewContext(read('scripts/manual-sql-config.js'), config, { timeout: 1000 });
  assert.equal(config.HEALTH_MANUAL_SQL_CONFIG.projectRef, 'uavimjgccigpbwqmfkhh');
  assert.equal(config.HEALTH_MANUAL_SQL_CONFIG.endpoint, 'https://uavimjgccigpbwqmfkhh.supabase.co/functions/v1/mobile-health-beta/v1/engine/web');
  const assets = ['.nojekyll', 'index.html', 'build.json'];
  for (const [, src] of html.matchAll(/<script[^>]*src="([^"]+)"/g)) {
    if (/^https?:/.test(src)) continue;
    const [name, query] = src.split('?');
    assert.match(name, /^scripts\/[a-z0-9-]+\.js$/);
    assert.equal(new URLSearchParams(query).get('v'), build);
    new vm.Script(read(name), { filename: name });
    assets.push(name);
  }
  assert.equal(assets.length, 9);
  for (const [, source] of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(source);
  return { build_id: build, build: 'PASS_STATIC', secret_scan: 'PASS_SCOPED_PATTERNS',
    assets: assets.map(name => ({ path: name, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex') })) };
}
if (require.main === module) console.log(JSON.stringify(verify(process.cwd(), process.env.GITHUB_REPOSITORY || REPOSITORY)));
module.exports = { verify, scan, REPOSITORY };
