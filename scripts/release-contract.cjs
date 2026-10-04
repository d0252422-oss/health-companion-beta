'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { verify, REPOSITORY } = require('./verify-web.cjs');
const PAGES = 'https://d0252422-oss.github.io/health-companion-beta/';
const MANIFEST = '.ai-pool/release/candidate.json';
const TESTS = ['tests/training-day-card.test.cjs', 'tests/build-recovery.test.cjs', 'tests/web-readback.test.cjs', 'tests/shared-chart.test.cjs', 'tests/release-web.test.cjs'];
const ASSETS = ['.nojekyll', 'index.html', 'build.json', 'scripts/build-version.js', 'scripts/manual-sql-config.js', 'scripts/core-ux-contract.js', 'scripts/local-engine-web.js', 'scripts/web-view-state.js', 'scripts/manual-observation-web.js'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function validate(m, repository = REPOSITORY) {
  assert.deepEqual(Object.keys(m).sort(), ['schema_version', 'repository', 'target', 'release_type', 'candidate_sha', 'source_candidate_sha', 'expected_build_id', 'required_tests', 'migration_required', 'edge_required', 'web_required', 'apk_required', 'created_at', 'assets'].sort(), 'MANIFEST_FIELDS');
  assert.equal(repository, REPOSITORY, 'BETA_REPOSITORY_ONLY');
  assert.equal(m.repository, REPOSITORY, 'BETA_REPOSITORY_ONLY');
  assert.equal(m.schema_version, 1);
  assert.equal(m.target, 'beta', 'BETA_TARGET_ONLY');
  assert.equal(m.release_type, 'web');
  assert.equal(m.web_required, true);
  for (const field of ['migration_required', 'edge_required', 'apk_required']) assert.equal(m[field], false, 'PURE_WEB_ONLY');
  assert.match(m.candidate_sha, /^[a-f0-9]{40}$/);
  assert.match(m.source_candidate_sha, /^[a-f0-9]{40}$/);
  assert.match(m.expected_build_id, /^\d{8}-beta-[a-z0-9-]+$/);
  assert.ok(typeof m.created_at === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(m.created_at) && Number.isFinite(Date.parse(m.created_at)));
  assert.deepEqual(m.required_tests, TESTS, 'REQUIRED_TEST_SET');
  assert.deepEqual(m.assets.map(a => a.path), ASSETS, 'ASSET_ALLOWLIST');
  for (const asset of m.assets) assert.match(asset.sha256, /^[a-f0-9]{64}$/);
  return m;
}
function readManifest(repository = REPOSITORY) {
  return validate(JSON.parse(fs.readFileSync(path.join(__dirname, '..', MANIFEST), 'utf8')), repository);
}
function candidateBuild(root, m) {
  validate(m);
  const git = (...args) => cp.execFileSync('git', ['-C', root, ...args]);
  assert.equal(git('rev-parse', 'HEAD').toString().trim(), m.candidate_sha, 'EXACT_CANDIDATE_REQUIRED');
  const build = verify(root);
  assert.equal(build.build_id, m.expected_build_id);
  assert.deepEqual(build.assets.map(a => a.path), ASSETS);
  // Hash Git blobs, not Windows checkout newlines. Deployed bytes are these same blobs.
  return m.assets.map(asset => {
    const bytes = git('show', `${m.candidate_sha}:${asset.path}`);
    assert.equal(hash(bytes), asset.sha256, `ASSET_HASH_MISMATCH: ${asset.path}`);
    return { ...asset, bytes };
  });
}
function stage(root, destination, m) {
  const files = candidateBuild(root, m);
  if (fs.existsSync(destination)) assert.equal(fs.readdirSync(destination).length, 0, 'OUTPUT_NOT_EMPTY');
  for (const file of files) {
    const target = path.join(destination, file.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.bytes, { flag: 'wx' });
  }
}
async function probe(m, fetcher = fetch) {
  validate(m);
  for (const asset of m.assets.filter(a => a.path !== '.nojekyll')) {
    const response = await fetcher(`${PAGES}${asset.path}?release=${m.candidate_sha}&t=${Date.now()}`, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
    if (response.status !== 200 || hash(Buffer.from(await response.arrayBuffer())) !== asset.sha256) return false;
  }
  return true;
}
function result(m, env) {
  validate(m);
  const passed = env.BUILD_RESULT === 'success' && env.VERIFY_RESULT === 'success' && (env.PAGES_RESULT === 'success' || (env.PAGES_RESULT === 'skipped' && env.ALREADY_CURRENT === 'true'));
  assert.match(env.GITHUB_RUN_ID || '', /^\d+$/);
  assert.match(env.GITHUB_SHA || '', /^[a-f0-9]{40}$/);
  return { candidate_sha: m.candidate_sha, workflow_run: `https://github.com/${REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`, status: passed ? 'PASS_PUBLIC_ARTIFACTS' : 'FAIL', merge_commit: env.GITHUB_SHA,
    build_id: m.expected_build_id, pages_status: env.PAGES_RESULT === 'success' ? 'DEPLOYED' : env.ALREADY_CURRENT === 'true' ? 'ALREADY_CURRENT' : env.PAGES_RESULT,
    live_probe_status: env.VERIFY_RESULT, authenticated_acceptance: 'NOT_ASSERTED_BY_PUBLIC_PROBE', timestamp: new Date().toISOString() };
}
async function main() {
  const [command, root, destination] = process.argv.slice(2);
  const m = readManifest(process.env.GITHUB_REPOSITORY || REPOSITORY);
  if (command === 'validate') {
    console.log(JSON.stringify({ candidate_sha: m.candidate_sha, expected_build_id: m.expected_build_id }));
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `candidate_sha=${m.candidate_sha}\nbuild_id=${m.expected_build_id}\n`);
  } else if (command === 'build') stage(path.resolve(root), path.resolve(destination), m);
  else if (command === 'probe' || command === 'verify') {
    let matched = false;
    for (let attempt = 0; attempt < (command === 'verify' ? 12 : 1); attempt++) {
      try { matched = await probe(m); } catch { matched = false; }
      if (matched) break;
      if (command === 'verify' && attempt < 11) await new Promise(resolve => setTimeout(resolve, 10000));
    }
    console.log(JSON.stringify({ public_assets_match: matched }));
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `current=${matched}\n`);
    if (command === 'verify' && !matched) throw new Error('PUBLIC_ASSET_MISMATCH');
  } else if (command === 'result') {
    const dir = path.resolve(__dirname, '../.ai-pool/release-results');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${m.candidate_sha}.json`), JSON.stringify(result(m, process.env), null, 2) + '\n');
  } else throw new Error('UNKNOWN_RELEASE_COMMAND');
}
if (require.main === module) main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
module.exports = { validate, candidateBuild, stage, probe, result, TESTS, ASSETS, MANIFEST, PAGES };
