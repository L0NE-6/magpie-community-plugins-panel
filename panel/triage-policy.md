# Triage Policy

## Priority

| Priority | Criteria | Target |
| :--- | :--- | :--- |
| P0 | Credential exposure, account ban, data loss, code execution | Immediate containment |
| P1 | Login broken, all requests fail, stream corruption, platform outage | Reproduce within 24h |
| P2 | One provider/model/client bug, quota or usage mismatch | Reproduce within 7d |
| P3 | Registry, docs, naming, polish | Batch review |

## Status

| Status | Meaning |
| :--- | :--- |
| `needs-repro` | Report has no reliable reproduction |
| `reproduced` | Failure reproduced with version and environment |
| `root-cause` | Code path and cause identified |
| `fix-ready` | Test and patch exist locally |
| `upstream-pr` | Focused PR opened upstream |
| `waiting-upstream` | Blocked on upstream review or release |
| `duplicate` | Same root cause as another item |
| `not-reproducible` | Evidence does not support the report |
| `fixed-locally` | Fork has a tested patch not yet upstream |

## Evidence

An item is not `reproduced` without:

- exact plugin and Magpie versions;
- OS/client;
- steps;
- redacted output;
- deterministic result;
- expected vs actual behavior.

An item is not `fix-ready` without:

- a failing regression test;
- a minimal patch;
- a passing package test;
- a compatibility statement.

## Security

Potential credential leaks, destructive actions and account bans are handled
privately until the upstream maintainer has a remediation path.
