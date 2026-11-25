# Maintenance Agent Guide

This repository is the public maintenance fork of
`magpie-community/plugins`. Upstream remains the source of truth.

## Branch Rules

- `main` is an exact fast-forward mirror of `upstream/main`.
- `panel` is the default maintenance branch.
- Put one fix on one `fix/<issue>-<slug>` branch.
- Put one upstream PR reproduction on one `review/<pr>-<slug>` branch.
- Never force-push `main` or `panel`.

## Parallel Work

Use parallel sub-agents for independent work whenever it is safe:

- one agent clusters upstream issues;
- one agent reviews open pull requests;
- one agent reproduces a package failure;
- one agent checks documentation and registry consistency.

The primary agent owns shared files, conflict resolution, final validation and
all Git writes. Sub-agents must not push, merge, publish or close upstream
items unless the primary agent explicitly assigns that action.

## Issue And PR Handling

1. Read the complete issue or PR thread, including closed follow-ups.
2. Identify the affected package, version, platform and client.
3. Reproduce the failure with a focused test or a documented command.
4. Never claim a real-device or signed-in-account test that was not performed.
5. Open a focused upstream PR when the fix belongs upstream.
6. Keep the same commit available on a `fix/*` branch in this fork.
7. Comment with evidence, test output and the exact remaining limitation.

Do not close or merge an upstream item without upstream maintainer permission.

## Security And Privacy

- Never commit cookies, tokens, JWTs, phone numbers, account IDs, private
  prompts, local browser profiles or unredacted HAR files.
- Do not publish packages to the upstream `@magpie-community` npm scope.
- Do not write to the upstream `dist` branch.
- Report credential exposure privately through GitHub Security Advisories.

## Validation

Before committing panel changes:

```powershell
node scripts/panel-check.mjs --fixture
node scripts/panel-sync.mjs --fixture --out "$env:TEMP\magpie-panel-fixture"
node scripts/panel-check.mjs --dir "$env:TEMP\magpie-panel-fixture"
node scripts/panel-priority.mjs --check
```

For package changes, also run the focused package test and:

```powershell
bun scripts/check.mjs <package>
```

Run the full suite when shared behavior or multiple packages are affected.
