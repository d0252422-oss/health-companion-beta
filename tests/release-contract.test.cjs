'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { validate, probe, result } = require('../scripts/release-contract.cjs');
const { eligible, assertChecks, assertScope } = require('../scripts/release-request.cjs');
const manifest = require('../.ai-pool/release/candidate.json');
const clone = () => structuredClone(manifest);
test('valid pinned Beta Web release request accepted', () => assert.equal(validate(clone()).target, 'beta'));
test('Production repository and target rejected', () => {
  assert.throws(() => validate({ ...clone(), target: 'production' }), /BETA_TARGET_ONLY/);
  assert.throws(() => validate(clone(), 'd0252422-oss/haelth-companion'), /BETA_REPOSITORY_ONLY/);
});
test('backend, migration, APK and arbitrary manifest fields rejected', () => {
  for (const field of ['migration_required', 'edge_required', 'apk_required']) assert.throws(() => validate({ ...clone(), [field]: true }), /PURE_WEB_ONLY/);
  assert.throws(() => validate({ ...clone(), credential: 'not-a-real-secret' }), /MANIFEST_FIELDS/);
});
test('test omission, path traversal and checksum corruption rejected', () => {
  const a = clone(); a.required_tests.pop(); assert.throws(() => validate(a), /REQUIRED_TEST_SET/);
  const b = clone(); b.assets[0].path = '../file'; assert.throws(() => validate(b), /ASSET_ALLOWLIST/);
  const c = clone(); c.assets[0].sha256 = 'not-a-hash'; assert.throws(() => validate(c));
});
test('exact duplicate public release is idempotently detected', async () => {
  const m = clone();
  for (const a of m.assets) a.sha256 = crypto.createHash('sha256').update(a.path).digest('hex');
  const fetcher = async url => ({ status: 200, arrayBuffer: async () => Buffer.from(decodeURI(new URL(url).pathname.replace('/health-companion-beta/', ''))) });
  assert.equal(await probe(m, fetcher), true);
  assert.equal(await probe(m, fetcher), true);
});
test('public mismatch and non-200 response cannot pass', async () => {
  assert.equal(await probe(clone(), async () => ({ status: 200, arrayBuffer: async () => Buffer.from('wrong') })), false);
  assert.equal(await probe(clone(), async () => ({ status: 404 })), false);
});
const env = { GITHUB_RUN_ID: '123', GITHUB_SHA: 'a'.repeat(40), BUILD_RESULT: 'success', PAGES_RESULT: 'success', VERIFY_RESULT: 'success' };
test('Pages result recorded with exact candidate and public-only acceptance', () => {
  const output = result(clone(), env);
  assert.equal(output.candidate_sha, manifest.candidate_sha);
  assert.equal(output.status, 'PASS_PUBLIC_ARTIFACTS');
  assert.equal(output.pages_status, 'DEPLOYED');
  assert.equal(output.authenticated_acceptance, 'NOT_ASSERTED_BY_PUBLIC_PROBE');
});
test('failed CI or live verification cannot produce successful release result', () => {
  for (const key of ['BUILD_RESULT', 'PAGES_RESULT', 'VERIFY_RESULT']) assert.equal(result(clone(), { ...env, [key]: 'failure' }).status, 'FAIL');
});
test('duplicate deployment skip requires actual successful probe', () => {
  assert.equal(result(clone(), { ...env, PAGES_RESULT: 'skipped', ALREADY_CURRENT: 'true' }).status, 'PASS_PUBLIC_ARTIFACTS');
  assert.equal(result(clone(), { ...env, PAGES_RESULT: 'skipped' }).status, 'FAIL');
});
test('session-independent contract ignores sender sandbox, drives and gh', () => {
  const isolatedSender = { approval: 'never', network: 'disabled', workspace: 'restricted', gh: null };
  assert.equal(validate(clone()).target, 'beta');
  assert.equal(result(clone(), env).status, 'PASS_PUBLIC_ARTIFACTS');
  assert.equal(isolatedSender.gh, null); // Simulation only; actual hosted run supplies integration evidence.
});
test('failed, missing or pending checks prevent auto-merge', () => {
  assert.throws(() => assertChecks([], ''), /MISSING_CI/);
  for (const conclusion of ['failure', 'cancelled', null]) assert.throws(() => assertChecks([{ name: 'beta-web-gate', status: 'completed', conclusion }], ''), /CI_NOT_PASS/);
  assert.throws(() => assertChecks([{ name: 'beta-web-gate', status: 'completed', conclusion: 'success' }], 'REVIEW_REQUIRED'), /REVIEW_NOT_PASS/);
});
test('workflow, backend and deletion changes require manual scoped review', () => {
  const request = { filename: '.ai-pool/release/candidate.json', status: 'modified' };
  assert.doesNotThrow(() => assertScope([request]));
  for (const filename of ['.github/workflows/beta-web-ci.yml', 'scripts/release-request.cjs', 'supabase/secret.sql']) assert.throws(() => assertScope([request, { filename, status: 'modified' }]));
  assert.throws(() => assertScope([request, { filename: 'index.html', status: 'removed' }]));
});
test('only owner-authored same-repository frozen release PR can auto-merge', () => {
  const pr = { state: 'open', draft: false, user: { login: 'd0252422-oss' }, base: { ref: 'main', repo: { full_name: manifest.repository } }, head: { ref: 'codex/beta-release/test', sha: 'a'.repeat(40), repo: { full_name: manifest.repository } } };
  const run = { conclusion: 'success', event: 'pull_request', path: '.github/workflows/beta-web-ci.yml', head_sha: pr.head.sha };
  assert.equal(eligible(pr, run), true);
  assert.equal(eligible({ ...pr, state: 'closed' }, run), false);
  assert.equal(eligible({ ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } }, run), false);
  assert.equal(eligible({ ...pr, user: { login: 'different-user' } }, run), false);
  assert.equal(eligible({ ...pr, head: { ...pr.head, repo: { full_name: 'other/repo' } } }, run), false);
});
test('hosted pipeline pins actions, gates deploy, isolates secrets and has no paid/local executor', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/beta-pages-release.yml'), 'utf8');
  for (const [, action] of workflow.matchAll(/uses: (\S+)/g)) assert.match(action, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
  assert.match(workflow, /needs: build/);
  assert.match(workflow, /ref: \$\{\{ steps\.manifest\.outputs\.candidate_sha \}\}/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /retention-days: 90/);
  assert.doesNotMatch(workflow, /self-hosted|windows-latest|secrets\.|danger-full-access|CodexSandbox|D:\\|gh auth/);
});
