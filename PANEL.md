# Magpie Community Plugins Maintenance Panel

This repository is a public maintenance fork of
[`magpie-community/plugins`](https://github.com/magpie-community/plugins).
It keeps the upstream project as the source of truth while adding a reproducible
issue/PR triage and patch workflow.

The goal is not to create a competing plugin marketplace. The goal is to:

- make the upstream backlog visible and searchable;
- reproduce high-impact bugs with evidence;
- send focused fixes and reviews back upstream;
- keep a tested maintenance branch for local users when an upstream fix is not
  yet merged;
- keep every change traceable to an upstream issue, PR or package test.

## Current Upstream Snapshot

Live check: **2026-11-25 12:10 CST**

| Metric | Value |
| :--- | ---: |
| Upstream open issues | 388 |
| Upstream open pull requests | 248 |
| Merged PRs in the previous 7 days | 5 |
| Closed issues in the previous 7 days | 8 |
| Upstream default branch | `main` |
| License | MIT |

The counts are a snapshot, not a promise. The generated dashboard under
[`panel/`](panel/) refreshes from GitHub Actions.

The published maintenance dashboard is available at
<https://l0ne-6.github.io/magpie-community-plugins-panel/>. It reads the same
generated snapshot as the repository, with search, package filters and the
curated priority queue.

The [maintenance log](panel/maintenance-log.md) separates verified local
integrations from the remaining upstream queue.

## Source Of Truth

Upstream remains authoritative:

- package code and versions come from `magpie-community/plugins`;
- npm packages remain under the upstream `@magpie-community` scope;
- the upstream `dist` branch remains the fallback install channel;
- upstream issues and PRs remain the primary discussion location;
- fixes should be proposed upstream first whenever possible.

This fork must never publish a package to npm or overwrite upstream release
channels.

## Branches

| Branch | Purpose |
| :--- | :--- |
| `main` | Exact mirror of upstream `main`; no panel-only changes |
| `panel` | Default maintenance branch: upstream code + panel docs, automation and local fixes |
| `fix/<issue>-<slug>` | One focused fix for an upstream issue |
| `review/<pr>-<slug>` | Local review/reproduction branch for an upstream PR |

`panel` is rebased or merged from `main`; it is never force-pushed.

## Maintenance Lifecycle

### 1. Intake

The panel sync workflow reads upstream open issues and PRs, then generates:

- `panel/status.json`: machine-readable counts and metadata;
- `panel/issues.md`: issues grouped by package and priority;
- `panel/pulls.md`: PRs grouped by package, draft state and review priority;
- `panel/triage-seed.json`: curated high-priority queue.

### 2. Triage

Every item is classified:

- **P0**: security, credential exposure, account ban, destructive data loss;
- **P1**: login broken, empty replies, stream corruption, platform-wide failure;
- **P2**: one provider/model bug, compatibility gap, incorrect usage/quota;
- **P3**: documentation, registry listing, naming, polish.

Status:

- `needs-repro`
- `reproduced`
- `root-cause`
- `fix-ready`
- `upstream-pr`
- `waiting-upstream`
- `duplicate`
- `not-reproducible`
- `fixed-locally`

### 3. Reproduce

A reproduction must include:

- Magpie version;
- plugin name and version;
- OS and client;
- minimal request or UI steps;
- expected and actual result;
- redacted logs;
- whether the failure is deterministic;
- the relevant package test that fails or is missing.

Never ask for or publish real cookies, tokens, JWTs, phone numbers, account IDs
or private prompts.

### 4. Fix

The preferred order is:

1. add or repair a failing test in the package;
2. reproduce the failure;
3. make the smallest compatible change;
4. run the package test and the repository checks;
5. open a focused PR upstream;
6. keep the same commit available on a `fix/*` branch in this fork.

Do not bundle unrelated registry entries, formatting changes or package bumps
into a bug fix.

### 5. Review Upstream PRs

For an upstream PR:

- confirm the reported bug or feature is real;
- check the package version bump and changelog;
- run the relevant tests;
- check credentials, redirects, proxy handling and network allowlists;
- check Windows, Linux and macOS paths where applicable;
- test malformed/empty/streaming responses;
- comment upstream with evidence;
- never claim to have tested a platform or account that was not actually tested.

## Upstream Sync

The `upstream-sync` workflow:

- fetches `magpie-community/plugins/main`;
- merges it into `panel`;
- fails on conflicts instead of force-pushing;
- leaves conflict resolution to a maintainer.

Manual sync:

```powershell
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
git switch panel
git merge main
git push origin panel
```

## Local Use

Normal users should install upstream packages:

```sh
magpie plugin add @magpie-community/opencode-<name>-auth
```

Use a fork checkout only when:

- an issue has a tested local fix;
- the upstream PR is open but not merged;
- the user explicitly wants to validate the patch.

```sh
magpie plugin add ./packages/<name>
```

## Testing

Repository-wide:

```sh
HOME=$(mktemp -d) bun test
bun scripts/check.mjs
```

Single package:

```sh
bun test packages/<name>
bun scripts/check.mjs <name>
```

Panel:

```sh
node scripts/panel-check.mjs
```

## Publishing Guard

Upstream publishing is intentionally disabled outside
`magpie-community/plugins`.

The fork must not:

- run npm trusted publishing;
- push to the upstream `dist` branch;
- publish under `@magpie-community`;
- reuse upstream release secrets;
- create tags that look like upstream package releases.

## Contribution Rules

- One issue or PR per fix.
- No credential data in issues, tests, fixtures or screenshots.
- No “works on my machine” claims without environment details.
- No closing an upstream issue without upstream permission.
- No force-push to `main` or `panel`.
- No automatic merge of an unreviewed PR.
- Preserve upstream copyright and MIT license notices.

## Limitations

A fork cannot close upstream issues, merge upstream PRs, assign upstream labels
or publish upstream npm packages without collaborator permissions. Until those
permissions exist, this panel can reproduce, document, review, patch and submit
evidence upstream, but the upstream maintainers retain final control.
