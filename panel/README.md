# Maintenance Dashboard

This directory is generated and maintained by the panel workflows.

The static maintenance dashboard starts at `index.html` and is published by
the `pages` workflow.

| File | Purpose |
| :--- | :--- |
| `status.json` | Upstream repository, issue, PR and sync metadata |
| `issues.md` | Open upstream issues grouped by package and priority |
| `pulls.md` | Open upstream PRs grouped by package and review priority |
| `triage-seed.json` | Curated high-impact queue |
| `priority.md` | Human-readable P0/P1 issue and PR queue |
| `triage-policy.md` | Priority and status rules |
| `upstream-sync.md` | Sync and conflict policy |

The dashboard is a mirror. Upstream remains the place to comment, review,
merge or close.

## Refresh

The `panel-sync` workflow refreshes generated files every six hours and on
manual dispatch.

## Local Validation

```sh
node scripts/panel-check.mjs
node scripts/panel-priority.mjs --check
```
