'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { verify, scan } = require('../scripts/verify-web.cjs');
test('static build verifies Beta markers, endpoint and publishable assets', () => {
  const result = verify(path.join(__dirname, '..'));
  assert.equal(result.assets.length, 10);
  assert.equal(result.secret_scan, 'PASS_SCOPED_PATTERNS');
});
test('Production repository rejected before reading files', () => {
  assert.throws(() => verify('.', 'd0252422-oss/haelth-companion'), /Beta repository only/);
});
test('environment and private key files cannot enter release', () => {
  for (const name of ['.env', '.env.local', 'nested/.env.beta', 'secret.pem']) assert.throws(() => scan(name, 'sample'), /disallowed/);
});
test('private credentials rejected without returning their value', () => {
  const synthetic = 'gh' + 'p_' + 'x'.repeat(40);
  assert.throws(() => scan('sample.js', synthetic), error => /credential pattern: sample.js/.test(error.message) && !error.message.includes(synthetic));
});
test('privileged JWT role rejected but public anon role allowed', () => {
  const jwt = role => [Buffer.from('{"alg":"none"}').toString('base64url'), Buffer.from(JSON.stringify({ role })).toString('base64url'), 'signature'].join('.');
  assert.throws(() => scan('sample.js', jwt('service_role')), /privileged token/);
  assert.doesNotThrow(() => scan('sample.js', jwt('anon')));
});
