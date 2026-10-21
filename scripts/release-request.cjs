'use strict';
// Runs only from the trusted default-branch workflow; never executes PR code.
const assert = require('node:assert/strict');
const { validate, MANIFEST } = require('./release-contract.cjs');
const { REPOSITORY } = require('./verify-web.cjs');
function eligible(pr, run) {
  return run.conclusion === 'success' && run.event === 'pull_request' &&
    run.path === '.github/workflows/beta-web-ci.yml' && pr.state === 'open' && !pr.draft &&
    pr.base.repo.full_name === REPOSITORY && pr.head.repo?.full_name === REPOSITORY &&
    pr.base.ref === 'main' && /^codex\/beta-release\/[a-z0-9-]+$/.test(pr.head.ref) &&
    pr.user.login === 'd0252422-oss' && pr.head.sha === run.head_sha;
}
function assertChecks(checks, review) {
  assert.ok(checks.some(c => c.name === 'beta-web-gate'), 'MISSING_CI');
  assert.ok(checks.every(c => c.status === 'completed' && c.conclusion === 'success'), 'CI_NOT_PASS');
  assert.ok(!['CHANGES_REQUESTED', 'REVIEW_REQUIRED'].includes(review), 'REVIEW_NOT_PASS');
}
function assertScope(files) {
  assert.ok(files.some(f => f.filename === MANIFEST), 'RELEASE_REQUEST_REQUIRED');
  const allowed = /^(?:\.ai-pool\/release\/candidate\.json|index\.html|build\.json|scripts\/(?:build-version|core-ux-contract|local-engine-web|manual-observation-web|manual-sql-config|web-view-state)\.js|tests\/[a-z0-9-]+\.test\.cjs)$/;
  assert.ok(files.every(f => allowed.test(f.filename) && f.status !== 'removed' && !f.previous_filename), 'AUTOMERGE_SCOPE_REQUIRES_REVIEW');
}
async function handle({ github, context, core }) {
  const { owner, repo } = context.repo;
  assert.equal(`${owner}/${repo}`, REPOSITORY);
  const run = context.payload.workflow_run;
  if (run.conclusion !== 'success' || run.event !== 'pull_request') return;
  const related = run.pull_requests.length ? run.pull_requests : (await github.rest.repos.listPullRequestsAssociatedWithCommit({ owner, repo, commit_sha: run.head_sha })).data;
  for (const item of related) {
    const pr = (await github.rest.pulls.get({ owner, repo, pull_number: item.number })).data;
    if (!eligible(pr, run)) continue;
    const files = await github.paginate(github.rest.pulls.listFiles, { owner, repo, pull_number: pr.number, per_page: 100 });
    assertScope(files);
    const content = (await github.rest.repos.getContent({ owner, repo, path: MANIFEST, ref: pr.head.sha })).data;
    assert.ok(content.type === 'file' && content.size < 20000);
    const manifest = validate(JSON.parse(Buffer.from(content.content, 'base64').toString('utf8')));
    const comparison = (await github.rest.repos.compareCommits({ owner, repo, base: manifest.candidate_sha, head: pr.head.sha })).data;
    assert.equal(comparison.merge_base_commit.sha, manifest.candidate_sha, 'CANDIDATE_NOT_IN_PR');
    // Candidate and PR tip must publish exactly the same app blobs.
    assert.ok(comparison.files.every(f => !/^(index\.html|build\.json|scripts\/(?!release)|\.nojekyll)/.test(f.filename)), 'APP_CHANGED_AFTER_CANDIDATE_FREEZE');
    const checks = await github.paginate(github.rest.checks.listForRef, { owner, repo, ref: pr.head.sha, per_page: 100 });
    const info = await github.graphql('query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$number){reviewDecision}}}', { owner, repo, number: pr.number });
    assertChecks(checks, info.repository.pullRequest.reviewDecision);
    const statuses = (await github.rest.repos.getCombinedStatusForRef({ owner, repo, ref: pr.head.sha })).data.statuses;
    assert.ok(statuses.every(s => s.state === 'success'), 'COMMIT_STATUS_NOT_PASS');
    const merged = (await github.rest.pulls.merge({ owner, repo, pull_number: pr.number, sha: pr.head.sha, merge_method: 'merge' })).data;
    assert.equal(merged.merged, true, 'MERGE_NOT_CONFIRMED');
    // GITHUB_TOKEN merges do not trigger push workflows; explicit dispatch is required.
    await github.rest.actions.createWorkflowDispatch({ owner, repo, workflow_id: 'beta-pages-release.yml', ref: 'main' });
    core.info(`Beta release request PR #${pr.number} merged and dispatched at ${merged.sha}`);
  }
}
module.exports = { eligible, assertChecks, assertScope, handle };
