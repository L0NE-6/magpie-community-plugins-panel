# Maintenance Log

This log records verified work in the maintenance fork. It is not a claim that
the remaining upstream backlog is fixed.

## Integrated In The Current Panel Batch

| Upstream item | Package | Result | Evidence |
| :--- | :--- | :--- | :--- |
| #1358 | `zcode` | Adopted the `enc:v2` sign-in fix and added moved-data key selection coverage | focused package tests and PR review |
| #1535 | `workbuddy` | Removed empty `tool_calls` from forwarded reasoning deltas | 21 focused tests pass |
| #1112 | `providers-hub` | Added Tencent Marvis as `hub-marvis` and refreshed the provider summary | registry validation and upstream PR evidence |
| #1474 | `workbuddy` | Renews long-lived browser sign-ins ahead of expiry | package tests |
| #1294 | `agy-cli` | Defused upstream slash-command scanning in normal prompts | package tests |
| #1533 | `agy-cli` | Preserves live sessions across masking placeholder drift | package tests |
| #1427 | `catpaw` | Gives pasted-token accounts a distinct current-user identity | 76 focused tests pass |
| #1368 | `orcaterm` | Refuses tool action envelopes written as assistant replies | 178 focused tests pass |
| #1134 | `meowcode` | Refreshes the agent icon without changing model behavior | 5 focused tests pass |
| #1123 | `codar` | Refreshes the registry summary for the 0.3.x model and sign-in surface | registry validation |
| #1175 | `deja-vu` | Updates the harness count and local index description | registry validation |
| #1438 | `unisound` | Adds the published Unisound U Plan package to the registry | registry validation; npm package provenance checked |
| #1045 | `melete` | Adds the Melete reflection page | registry validation; npm package provenance checked |
| #1087 | `claude-zh` | Adds the Claude Desktop Chinese catalog page | registry validation; npm package provenance checked |
| #1144 | `godwit` | Adds the Godwit mail-client agent | registry validation; npm package provenance checked |
| #1455 | `aws-quick` | Adds the Amazon Quick provider | registry validation; npm package provenance checked |
| #1508 | `lingxi` | Adds the WPS Lingxi agent | registry validation; npm package provenance checked |
| #1538 | `codearts` | Streams GLM tool-call arguments with `tool_stream` | focused GLM test passes; package check passes; two unrelated Windows temp-cleanup errors remain in the full suite |
| #1539 | `cam` | Adds the hardened context attachment gateway | 55 tests pass / 1 POSIX-permission skip; build and package dry-run pass |
| #1541 | `agy-cli` | Returns a retryable capacity 503 immediately instead of waiting for silent agy retries | 6 focused and 99 repeat-batch tests pass |
| #1542 | `agy-cli` | Stops a family alias from standing in for a model another signed-in account lists | upstream tests pass |
| #1545 | `agy-cli` | Runs a Claude Code AgentSummary in a session scope beside its worker | upstream tests pass |
| #1547 | `kiro` | Sends `TokenType: EXTERNAL_IDP` on control-plane calls for enterprise IdP sign-ins | 15 Kiro usage tests pass; package bumped to 0.1.42 |
| #1524 | `agy-cli` | Preserves active DSH `<available_skills>` and workspace instructions when clipping large replays | upstream tests pass; synced as `d388cd6` |
| #1522 | `agy-cli` | Uses Magpie's namespaced proxy variables for OAuth refresh, Code Assist quota reads and `agy` child processes | 17 platform tests and 2 proxy/usage tests pass; no live proxy/account A/B verification |
| #1475 | `agy-cli` | Treats an unchanged replayed `tool_result` as the same history after bridge notices were appended | upstream duplicate-result notice tests pass |
| #1491 | `agy-cli` | Keeps the live session when an earlier image has already been swapped for its placeholder | upstream image-slim tests pass |
| upstream `3150bdc` | `codearts` | Treats InferHub `001001005` on a chat over 10 MB as a 413 size error instead of retrying or renewing the account | 217 package tests pass with 0 failures; two unrelated Windows temp-cleanup `EBUSY` errors remain |

## Queue

The remaining open issues and pull requests stay visible in
[`issues.md`](issues.md), [`pulls.md`](pulls.md), and the curated
[`priority.md`](priority.md). Items are only marked fixed after a focused test
or a reproducible upstream verification.

## Boundaries

- An upstream PR being open does not mean it is merged.
- A local `panel` fix does not mean upstream has accepted it.
- Real-account, platform, and vendor-service behavior is reported separately
  from local unit tests.
