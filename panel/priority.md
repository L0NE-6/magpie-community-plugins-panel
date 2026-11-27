# Upstream Priority Queue

Curated from the public upstream snapshot at `2026-11-27T14:49:50.337+08:00`.

> This is a triage snapshot, not a claim that every item is reproduced.
> Mergeability, CI and live-account behavior must be verified before action.

## Backlog

| Open items | Count |
| :--- | ---: |
| Issues | 403 |
| Pull requests | 229 |
| Total | 632 |
| Recognized package clusters | 63 |

## Priority Issues

| Rank | Risk | Package | Issue | Action | Evidence |
| ---: | :---: | :--- | :--- | :--- | :--- |
| 1 | **P0** | `providers-hub` | [#699 providers-hub: the sign-in page's /paste takes a POST from any web page (no Origin check, no token)](https://github.com/magpie-community/plugins/issues/699) | Require a per-window URL token and same-origin POST, reject null origins, and add a cross-origin regression test. | open; 3 comments; updated 2026-11-26T03:42:16Z |
| 2 | **P1** | `opencode-lobster-auth` | [#1433 opencode-lobster-auth 这个插件让网易给我封号了](https://github.com/magpie-community/plugins/issues/1433) | Request plugin source/version, request timeline, and the ban notice; hold any registry promotion until ban-risk evidence is reviewed. | open; 1 comment; updated 2026-11-21T14:46:46Z |
| 3 | **P1** | `antigravity` | [#1148 \[请求优化\] antigravity被ban了，推测在多次预测/取消后产生429提示被ban](https://github.com/magpie-community/plugins/issues/1148) | Collect request counts, cancellation timestamps, response bodies, and ban notices; add cancellation/backoff guardrails after reproduction. | open; 31 comments; updated 2026-11-14T18:57:26Z |
| 4 | **P1** | `@magpie-community/opencode-agy-cli-auth` | [#893 agy-cli: isolate agy home (--gemini-dir / --disable-telemetry), guard built-in tools, strip Claude Code CLI identity, and intercept in-band soft-ban notices](https://github.com/magpie-community/plugins/issues/893) | Isolate agy state, disable telemetry, guard built-in tools, normalize client identity, and classify soft-ban notices as errors with tests. | open; 0 comments; updated 2026-11-09T09:09:45Z |
| 5 | **P1** | `@magpie-community/opencode-factory-auth` | [#1446 Factory 0.1.56: Cowork built-in MCP tool declarations still receive content_policy_rejected on Magpie 0.1.4657](https://github.com/magpie-community/plugins/issues/1446) | Local repair branch factory 0.1.60 removes the mcp__ exemption from full-retry aliasing and restores renamed Cowork MCP calls; 257 Factory tests pass, with a real signed-in Cowork rerun still unverified. Fork PR #14 records the maintenance repair; upstream PR #1611 (head 0c394583a7090753dfc99bcb6d2160bb14b739d4) remains open. | upstream-pr; 1 comment; updated 2026-11-27T04:01:32Z |
| 6 | **P1** | `workbuddy` | [#1532 workbuddy: empty delta.tool_calls: \[\] splits reasoning into thousands of parts and freezes OpenCode Desktop 2.x](https://github.com/magpie-community/plugins/issues/1532) | Ignore empty tool_calls arrays, coalesce reasoning chunks, and add a session-restore regression with the reported part counts. | closed-unmerged; closed 2026-11-25T11:52:29Z; 2 comments; updated 2026-11-25T11:54:36Z |
| 7 | **P1** | `agy-cli` | [#1512 agy-cli 0.1.116: validateBody 无条件拦截 tool_result + assistant prefill tail，导致流中断后 Magpie 断点续传必死 400（补 #1319/#1465 未覆盖根因与修复定位）](https://github.com/magpie-community/plugins/issues/1512) | Support or safely transform the prefill-tail shape, and add a resume test covering tool_result plus partial assistant text. | closed-unmerged; closed 2026-11-26T14:05:18Z; 4 comments; updated 2026-11-26T14:05:18Z |
| 8 | **P1** | `@magpie-community/opencode-zen-free-auth` | [#209 \[zen-free\] Dropping unknown tool calls as text ends autonomous DSH turns instead of allowing recovery](https://github.com/magpie-community/plugins/issues/209) | Preserve a recoverable tool error and stop rewriting malformed tool calls into a normal stop. | open; 1 comment; updated 2026-10-17T13:53:13Z |
| 9 | **P1** | `@magpie-community/opencode-qoder-auth` | [#1204 qoder-cn: chat returns 200 + keepalive only, never a single token (ideVersion sent empty)](https://github.com/magpie-community/plugins/issues/1204) | Review PR #1253, which cancels the pending first-event read on watchdog timeout and returns a bounded 504. | open; 5 comments; updated 2026-11-17T09:14:30Z |
| 10 | **P1** | `@magpie-community/opencode-qoder-auth` | [#1517 qoder-cn: with DeepSeek Harness (DSH) client — 200 + keepalive only, never a token (0.2.72, magpie 0.1.4746, Docker/Linux)](https://github.com/magpie-community/plugins/issues/1517) | Cross-link #1204/#1220 and verify PR #1253 in the Linux container with request and gateway traces; close as duplicate only if the root cause matches. | open; 6 comments; updated 2026-11-27T01:34:51Z |
| 11 | **P1** | `@magpie-community/opencode-zcode-auth` | [#1196 zcode: ZCode 3.18 saves credentials as enc:v2: — decrypt() only reads enc:v1, so "ZCode app's sign-in" loses the ZCode session (gift plans / -Trial unusable)](https://github.com/magpie-community/plugins/issues/1196) | Review PR #1358 as the canonical enc:v2 fix; consolidate or close overlapping PRs #1161/#1116/#1154 after comparison. | open; 5 comments; updated 2026-11-20T16:05:53Z |
| 12 | **P2** | `@magpie-community/opencode-copilot-auth` | [#618 Copilot slots lapse after ~24h idle although the GitHub OAuth token is still valid (only the active account is renewed)](https://github.com/magpie-community/plugins/issues/618) | Add a background refresh path for every signed-in slot and verify idle multi-account renewal. | open; 1 comment; updated 2026-11-02T04:04:01Z |
| 13 | **P1** | `@magpie-community/opencode-trae-auth` | [#1516 trae: an enterprise sign-in's bare host is rejected, so every chat goes to the consumer gateway](https://github.com/magpie-community/plugins/issues/1516) | Normalize enterprise bare-host storage and add a SaaS catalog/chat regression. | open; 4 comments; updated 2026-11-26T04:23:02Z |
| 14 | **P1** | `@magpie-community/opencode-doubao-work-auth` | [#1417 \[doubao-work\] Windows 环境下非默认路径安装时启动崩溃 (0x80000003)，建议默认追加 --no-sandbox 参数](https://github.com/magpie-community/plugins/issues/1417) | Capture a crash dump and test the proposed launch-argument change on Windows custom-path installs before adopting it. | open; 0 comments; updated 2026-11-20T17:56:17Z |
| 15 | **P2** | `@magpie-community/opencode-agy-cli-auth` | [#1234 agy-cli (Windows): background quota refresh opens Google OAuth on transient token refresh failure at startup](https://github.com/magpie-community/plugins/issues/1234) | Suppress interactive OAuth for background quota work and retry the stored refresh token silently. | open; 2 comments; updated 2026-11-18T19:42:46Z |

## Priority Pull Requests

| Rank | Risk | Package | Pull request | Status | Action | Linked issues |
| ---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | **P1** | `@magpie-community/opencode-zcode-auth` | [#1358 zcode 0.1.69: reads ZCode 3.18's enc:v2 sign-in (#1196)](https://github.com/magpie-community/plugins/pull/1358) | open | 直接 review；维护 fork 已实现，上游 PR 仍需 rebase | #1196 |
| 2 | **P1** | `@magpie-community/opencode-qoder-auth` | [#1253 qoder 0.2.72: cancel the first-event read on watchdog](https://github.com/magpie-community/plugins/pull/1253) | fixed-locally | Review directly | #1204, #1517 |
| 3 | **P1** | `@magpie-community/opencode-agy-cli-auth` | [#1418 agy-cli 0.1.110: a standalone upstream status line is its HTTP error, not assistant text (#1416)](https://github.com/magpie-community/plugins/pull/1418) | open | Review directly | #1416 |
| 4 | **P1** | `@magpie-community/opencode-catpaw-auth` | [#1427 catpaw 0.2.4: a pasted token gets its own identity](https://github.com/magpie-community/plugins/pull/1427) | open | Review directly | #1426 |
| 5 | **P1** | `@magpie-community/opencode-codearts-auth` | [#1246 codearts 0.3.23: a refused catalog read no longer signs an account out](https://github.com/magpie-community/plugins/pull/1246) | open | Review directly | #1247 |
| 6 | **P1** | `agy-cli` | [#1485 fix(agy-cli): read default Linux file-backed sign-in](https://github.com/magpie-community/plugins/pull/1485) | closed-unmerged; closed 2026-11-25T13:31:50Z | Review directly | #1502 |
| 7 | **P2** | `agy-cli` | [#1441 fix(agy-cli): fall back to default token file on macOS when Keychain item is missing](https://github.com/magpie-community/plugins/pull/1441) | open | Review directly | none |
| 8 | **P1** | `@magpie-community/opencode-agy-cli-auth` | [#1296 agy-cli 0.1.117: recover from agy UNAUTHENTICATED (code 401) endings on a fresh process](https://github.com/magpie-community/plugins/pull/1296) | open | Review directly | #1326 |
| 9 | **P1** | `agy-cli` | [#1520 agy-cli 0.1.117: isolate sibling branches sharing a conversationKey](https://github.com/magpie-community/plugins/pull/1520) | closed-unmerged; closed 2026-11-25T13:31:58Z | Review directly | #1471 |
| 10 | **P1** | `@magpie-community/opencode-agy-cli-auth` | [#1394 agy-cli 0.1.113: preserve ACP sessions and support long MCP tool names](https://github.com/magpie-community/plugins/pull/1394) | open | Review directly | #1369, #1371 |
| 11 | **P1** | `@magpie-community/opencode-agy-cli-auth` | [#1287 agy-cli: preserve active context across suggestions, history forks and compaction](https://github.com/magpie-community/plugins/pull/1287) | open | Review directly | none |
| 12 | **P1** | `agy-cli` | [#1524 agy-cli 0.1.122: preserve active DSH &lt;available_skills&gt; and workspace instructions when clipping &gt;112 KiB replays](https://github.com/magpie-community/plugins/pull/1524) | closed-unmerged; closed 2026-11-25T13:25:56Z | Review directly | #1401 |
| 13 | **P1** | `@magpie-community/opencode-autoclaw-auth` | [#219 autoclaw: proactively refresh token on 401/403 before failing](https://github.com/magpie-community/plugins/pull/219) | open | Review directly | #217 |
| 14 | **P2** | `@magpie-community/page-agent-console` | [#1333 agent-console 1.3.11: keep following replies and queued turns active](https://github.com/magpie-community/plugins/pull/1333) | open | Review directly | none |
| 15 | **P1** | `@magpie-community/opencode-autoclaw-auth` | [#1066 autoclaw 0.2.26: remote-web panel login and startup isolation](https://github.com/magpie-community/plugins/pull/1066) | open | Review directly | none |

## Overlap Clusters

- **zcode-v2-credential-fixes** (#1358, #1161, #1116, #1154): All four touch ZCode 3.18 credential decryption or Keychain prompting. Review #1358 first, compare platform coverage, then consolidate the remaining stack instead of merging overlapping implementations. Status: #1358 open-pr, #1161 open-pr, #1116 open-pr, #1154 open-pr.
- **agy-session-context-stack** (#1520, #1394, #1287, #1524, #1283): These changes overlap in packages/agy-cli/index.mjs and address related conversation-key, replay, and live-session behavior. Review in the listed order and require rebases after each merge. Status: #1520 closed, #1394 open-pr, #1287 open-pr, #1524 closed, #1283 open-pr.
- **lobster-account-ban-evidence** (#1433, #1209): Issue #1433 reports an account ban while PR #1209 would add a LobsterAI registry entry. Do not promote the entry until source provenance and ban-risk evidence are reviewed. Status: #1433 open-issue, #1209 open-pr.

## Evidence Boundary

- Titles, bodies, open counts, comment counts, reactions, timestamps, draft state, and labels were read from the final paginated open-item snapshot.
- The issues endpoint includes pull-request shadow records; issue totals exclude those duplicates and reconcile with open_issues_count.
- The seven-day merged-PR and closed-issue counts in PANEL.md were read from GitHub Search at the same snapshot time.
- PR mergeability, conflict state, review approvals, and CI conclusions were not fetched and must be treated as unverified.
- Author test claims in PR bodies are recorded as claims; this audit did not run every package suite.
- The snapshot is point-in-time; run panel-sync and panel-pr-audit again before acting on stale counts.

Generated by `node scripts/panel-priority.mjs`.
