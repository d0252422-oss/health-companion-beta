# Beta Web release architecture

Target: `d0252422-oss/health-companion-beta` only. Production, Edge, migrations and APK are rejected. This is one GitHub Actions executor, not three parallel deployment systems.

## Canonical path

1. Codex (or another authorized publisher) prepares and tests Web code, freezes a source commit and writes `.ai-pool/release/candidate.json` in a subsequent commit. Asset hashes are SHA256 of Git blobs, not platform-dependent CRLF checkout bytes. Candidate SHA must be reachable from the request branch and no app file may change after the freeze.
2. The candidate and manifest must first reach GitHub through an authorized publisher. Offline/restricted sessions produce a package; they cannot promise queue delivery without a permitted communication path. Never tunnel through another process or defeat a managed policy.
3. An owner-authored same-repository PR on `codex/beta-release/<name>` targets `main`. `Beta Web CI` performs scoped tests/build/secret checks with read-only permissions and no persisted checkout credentials.
4. The default-branch `Beta Release Request` workflow independently checks exact head, scope, all checks and review status. Only Web/request changes are automatically merged. Workflow/backend/deletion changes require separately reviewed maintenance PRs. It uses the repository's ephemeral `GITHUB_TOKEN`; no personal token, new GitHub App or secret is provisioned.
5. After the head-pinned merge, the executor explicitly dispatches `Beta Pages Release`: GitHub-token merges do not trigger ordinary push workflows. A normal authorized merge changing the manifest also triggers release; duplicate requests serialize and skip publishing if all public bytes already match.
6. The hosted runner validates the contract, checks out the exact candidate, re-runs its fixed targeted tests and static safety checks, then stages only nine allowlisted public files. A separate job has Pages/OIDC write permission and uses the existing `github-pages` environment. It does not receive health/auth payloads.
7. Public verification compares build and eight served asset hashes. Every valid request run writes `.ai-pool/release-results/<candidate_sha>.json` into a downloadable `beta-release-result-<run>-<attempt>` Actions artifact (90-day retention), including failure/skip status. Results are not committed to main, avoiding write loops. Actions run/deployment history is the durable index. Public probes never claim authenticated numerical acceptance.

## Session independence and limits

Once GitHub has accepted the request, deployment requires no Codex process, local `gh`, D: drive, model, sandbox approval or sender network. Hosted CI must complete while the initiating session performs only reads. Synthetic environment tests are labeled simulation, not proof of a real disconnected device. A totally offline new Codex session cannot read fresh remote results until it regains a permitted connection or receives an exported result.

The `redeploy=true` workflow-dispatch input is explicit recovery/testing of the already-pinned artifact; ordinary duplicates skip deployment. It never skips tests or target guards.

## Recovery and fallback

- Failed CI/build/hash/target: no auto-merge/deploy. Repair the responsible scoped change and submit a new request. Never weaken checks.
- Failed Pages/public probe: keep prior working deployment, inspect the run, rerun the same manifest only after diagnosis. Do not assume a failed probe implies health data loss.
- If GitHub Actions is temporarily down, wait/retry its durable request first. Existing local Windows release scripts are the emergency fallback only, using the same repository/build/hash/test contract and the existing operator's authentication. They require an available trusted local executor; unattended service failover has NOT been provisioned or verified. No usable Codemagic Web executor was established, so none is invented.
- Changing Pages publishing source is a one-time Beta repository setting; OAuth, user permissions, branch rules and production settings are not changed. Never approve one's own required review or bypass CI.
- Public repository + standard GitHub-hosted Ubuntu runners + Pages; no larger/self-hosted runner, new paid service, subscription or billing activation. Artifacts have bounded retention.

## Ownership

Codex: code, scoped tests, immutable manifest, authorized queue submission and result readback. GitHub Actions: CI, guarded merge, artifact build, Pages, result. Human: logins, required reviews, policy changes, Production/destructive/account/payment boundaries. No parallel primary coding agent may alter the same release checkout.
