# Upstream pull requests: what is done, what is waiting, what should not be done

Written 2026-11-27 after working through the open pull requests of
`magpie-community/plugins`, `yetone/magpie` and `Gyl1219/magpie-providers-hub`.
It records the state of each one this fork acted on, so the next person does
not have to re-derive it.

Nothing here is merged upstream. A branch in this fork is a **proposal**: it
carries the rebase and its tests, and the maintainer still decides.

## Where things stand (2026-11-28)

`magpie-community/plugins`, `yetone/magpie`, `Gyl1219/magpie-providers-hub`:

| | count |
| --- | --- |
| open pull requests in plugins | **224** |
| of those, a branch exists in this fork | **93** (110 distinct PR numbers over the whole run, including ones since closed) |
| untouched open, statically self-consistent | **88** |
| untouched open, blocked before any work | 43 (10 carry a binary file, 2 modify a file that is not in main) |
| closed as already fixed | 2 |
| judged not-rebaseable | 8 |
| waiting on the author | 3 + 3 more raised this week |

**What "not-rebaseable" turned out to mean**, in the three shapes seen so far — all
discovered after a clean apply, never from a merge conflict:

1. **a symbol the patch uses, absent from main** (`IMAGE_MODEL_ID`, `DUE_FOR_RENEWAL`,
   `QUOTA_MARKER`, `FIRST_REPLY`): the patch was written against a branch that never
   landed. `maintenance/preflight.py` finds these in seconds.
2. **two generations of one subsystem** (`restModel/blocked` vs `rest/refused`;
   `find/installedAt` vs `installed/elsewhere`; `endorse/probeKey` vs per-request
   probing): the patch applies, both halves look sane, and the result is a model with
   half of each. Not rebasable — it needs the author's call or a rewrite on main's
   skeleton.
3. **the patch changes a contract main pins in a test** (#1437: main asserts the first
   browser sign-in has no prompts, "the host opens the window straight away"; the patch
   gives both browser methods a browser-select prompt). The test is not stale — it
   records an intent. Changing it is a product decision.

**The judging order that saves the most time**, in this repository:

1. `grep 'Binary files'` on the diff — if present, only the PR's tarball can build it.
2. `grep -E '^diff --git'` → every modified (not `new file mode`) path must exist in
   `origin/main`; `git apply --3way` says `does not exist in index` when one does not.
3. `maintenance/preflight.py <diff> <repo> <package>` — names the patch uses but neither
   defines nor finds. Exit 1 means another PR has to land first.
4. If the patch rewrites `registry.json` whole (`@@ -1,N +1,M @@` with M far above the
   current line count), take **only its own entry** from the PR's tarball, never the hunk.
5. Apply, then compare the **staged `+/-` line counts** with the patch per file — that is
   what caught a dropped `package.json` icon and a hunk applied twice.
6. Run the package's suite **and the baseline**: `git stash` the patch, run again. A test
   red in both is the environment; red only with the patch is the patch.

## Registry audit (2026-11-28)

Every delivered branch's `registry.json` was read back and validated. 169 branches:

| entries | branches | meaning |
| --- | --- | --- |
| 129 | 67 | main's count — a modification PR, no new package |
| 130 | 97 | main + the one entry the patch adds |
| 152 | 1 | `add/543-omo` — the 23 OmO roles, one entry each |
| 131 | 1 | `add/717-willdeep` — two packages |

**Eight branches carried registry damage and were repaired**:

- six had **incidental entries** from their PR's base (`fix/1541-…`, `fix/1253-…`, `fix/1427-…`,
  `fix/1446-…`, `fix/pages-actions` — 7–8 extra entries each; `review/1539-cam-gateway` — 6 extra
  beside its own). Cause: `registry_delta.py` used to apply every entry the PR's registry held and
  main lacked. Each now has main's 129 (or 130, for the one that adds `gateway-cam`).
- three were **behind main** (`review/1358-zcode-v2` at 126, `fix/1532-…` and `fix/upstream-1532`
  at 128): merging them would have **removed** entries main has added since. Their patches add no
  entries, so they were brought up to 129.

The tool now defaults to "only the package this patch adds" (`own` = its `+` `"package"` lines,
minus what main already has), which is what those six needed.

**What the audit does not prove**: that each branch's own change still applies cleanly on top of a
current main — it only proves the registry it carries is the right one.

## How a pull request was judged

In this order, because the order is what saves time:

1. **Shape first.** `added` vs `modified` file counts say most of it. A patch
   that only adds files cannot have a semantic conflict; one that rewrites a
   block upstream rewrote has no usable intersection.
2. **Has upstream touched that block since?** `git log --since='60 days ago'
   --oneline origin/main -- packages/<pkg>`. A busy package is not the same as
   a busy block: `agy-cli` had 157 changes in 60 days and one pull request
   still applied cleanly because its twenty lines were quiet.
3. **Is the issue still open?** `grep` the issue number in `origin/main`.
   Found in code *and* in tests → the fix exists, close the pull request.
4. **Run the package's own suite before committing.** A red suite that is also
   red on `origin/main` is the environment, not the patch — measure the
   baseline and compare (`gcp-ai`: 11 of 96 fail both ways, they drive Chrome).

## Delivered: 33 pull requests in `magpie-community/plugins`

Each is a branch in this fork, based on `origin/main`, with the package's own
tests green. Grouped by how much they needed.

| Pull request | Branch | Note |
| --- | --- | --- |
| #717 | `add/717-willdeep` | two agent packages, new files only |
| #1246 | `fix/1246-codearts-catalog` | a refused catalog read is not a sign-out |
| #1277 | `add/1277-qianwen` | new provider; **the package ships no tests** |
| #1358 | `review/1358-zcode-v2` | review branch |
| #1363 | `add/1363-packycode-balance` | new package, 9 tests |
| #1375 | `fix/1375-agy-open-object` | open object keeps extra keys |
| #1377 | `fix/1377-lorca` | keeps Lorca's MCP block when writing Magpie's provider |
| #1386 | `fix/1386-wps-comate` | **two product bugs fixed**: `homedir()` caches start-up value; latest-session tie picked the older conversation |
| #1389 | `fix/1389-agy-degraded-session` | session without a model catalog is closed and retried |
| #1390 | `fix/1390-kiro-thinking` | thinking budgets fit one turn |
| #1404 | `add/1404-clixad` | new provider, 7 tests |
| #1420 | `fix/1420-antigravity` | a stalled stream ends on its own deadlines |
| #1424 | `fix/1424-gcp-ai` | fractional JPY credits; 11 failures are the environment (Chrome), same on `main` |
| #1431 | `add/1431-astergate` | new provider, 4 tests |
| #1438 | `add/1438-unisound` | registry entry |
| #1440 | `fix/1440-tianshu-registry` | registry entry |
| #1444 | `fix/1444-atomcode` | unconfirmed CodingPlan status |
| #1209 | `fix/1209-lobsterai-registry` | registry entry |
| #870 | `fix/870-mask-context-registry` | registry entry |
| #1004 | `add/1004-route-insight` | new page; `start` moved onto the default export so `check.mjs` stops calling it as a plugin |
| #1066 | `feat/1066-autoclaw-login` | remote web sign-in panel |
| #1348 | `fix/1348-factory-models` | three models; the PR ships real Droid output as test data |
| #1419 | `fix/1419-layerfs` | `cmd.exe` on Windows, so quoting survives |
| #1427 | `fix/1427-catpaw-uid` | uid handling |
| #1444 … | … | see `git ls-remote origin` for the full list |
| #219 | `fix/219-autoclaw-refresh` | single-flight 401 renewal, keeps main's fingerprint verdict |
| #1468 | `fix/1468-agy-empty-after-tool` | an empty turn after a refused tool is asked again |
| #1472 | `fix/1472-agy-side-conversation` | a side conversation gets its own key |
| #1488 | `add/1488-firstmate` | 248 files; **use the PR's tarball, not the diff** — 191 SVGs come back as binary patches |
| #1539 | `fix/1539-cam` | `panelDir()` read where used; publisher throttle forced in the test |
| #1606 | `fix/1606-factory-droid` | pool lists are newer than the older provider's catalogue: compare **set difference**, not equality |
| #1628 | `add/1628-seu-chat` | 71 tests; `opencode2.mjs` is a byte-for-byte copy of `scripts/opencode2.mjs` |

## Closed as already fixed: 2

| Pull request | Why |
| --- | --- |
| #1258 | the behaviour it fixed had been implemented upstream |
| #1469 | `main` has `holdsHome()` in `platform.mjs`, which is **wider** than the patch's `path.resolve(workDir) !== path.resolve(os.homedir())` — it excludes home *and anything containing it*, with win32/posix path rules — and three tests already check it (`repeat-batch.mjs:2606`, `smoke.mjs:1113`, `platform.mjs:10`) |
| #438 | `main` has `startGate` / `startSlots` / `REQUEUE_MAX` / `startQueueAnswer`: the same queue, more complete. Merging the patch would **downgrade** it. Only `options: start-plan-three-concurrent` is still missing |

## Waiting on the maintainer: 3

All three are `agy-cli`, and each needs a decision rather than more work:

| Pull request | What is needed |
| --- | --- |
| #1416 | implemented (58 lines, 55 tests still green) but the end-to-end case cannot reach the path: `#onNotification` (`index.mjs:2741`) returns early on `!turn \|\| turn.done \|\| turn.finalized`, and under `testkit`'s scheduling `turn.done` may already be set when `agent.text()` lands. Needs a test entry that drives `#onNotification` directly |
| #1418 | **not** superseded — the issue is open and `main` only recognises a whitelist of banners. But the patch's ten conflicts all sit in `dropRetryBanner` / `heldFrom` / `startsLine`, which main rewrote. The generic `⚠ <STATUS> (code <NNN>):` shape cannot be matched with the `startsWith` test main uses, so it needs ~30–40 lines written against the current structure |
| #1296 | whether a UNAUTHENTICATED ending that arrives as **text** should be retried transparently, or answered 401 — a product decision |

## Needs to be redone, not rebased: 2

| Pull request | Why |
| --- | --- |
| #1394 | four of five conflicts resolve to "main is already more complete"; only `proc.ephemeral` and `toolsByMcpName()` remain. Two attempts broke `class Proc` (`Private field '#markDead' must be declared in an enclosing class`) — take the two pieces out of the patch instead of applying it whole |
| #1033 (in `yetone/magpie`) | **in progress**: `wip/1033-reasonix` carries 38 new files and all eight modified ones, and `go build -tags nogui ./...` passes. See below for what is left


## #1033 is done: `sessions` and `gui` both pass

`wip/1033-reasonix` (L0NE-6/magpie-panel, `b3256e002`) carries the 38 new files
and the PR's changes to eight existing ones, and reads a Reasonix history in all
three shapes it is kept in.

    go build -tags nogui ./...                → OK
    go test  -tags nogui ./internal/sessions/ → ok
    go test  -tags nogui ./internal/gui/      → ok

**The one thing worth knowing if you touch this again:** main's
`parse(f, old)` is `parseWith(f, old, nil)` -- a one-line wrapper -- so the
patch's three dispatch branches belong in **`parseRead`**. Put them anywhere
else and `parseReasonixWire` / `parseReasonixStore` (the PR's real readers) are
never called; the generic line parser runs instead and every usage line is lost.

Six independent bugs had to be fixed on the way, each of which made this agent's
usage read 0: `refresh` not knowing reasonix; `s.ID` set after the scan;
an empty sessionId judged "another session's"; `recordType` vs `kind`; a wire
line keeping `usage` at the top level while a ledger line nests it under
`event`; and a usage line with no time of its own (the file's mtime is the
fallback `droid.go` and `liveagent.go` already use).

Two more things that cost time and are not obvious:

- `state` embeds **`*StateMore`**, so writing `s.DBRevision` dereferences a nil
  pointer -- that was a panic, and `s.own().DBRevision` is the fix.
- A probe env var left in `parseRead` is caught by `internal/agent`'s
  `TestFolderVarsAreListed`: every variable `sessions` reads must be listed in
  `agentenv.Vars`, or no sandbox clears it and a test meets the agent the
  developer really has installed.

Baseline for judging failures here: `internal/agent` and `internal/cli` fail on
clean `upstream/main` too (`TestAside*`, `TestKeyNote`); `internal/davsync`
passes alone and only fails when run beside everything else.

## Do not touch: 3 (in `yetone/magpie`)

`docs/contributors.md` stops a review for changes to `.github/`, release and
publish scripts, `Dockerfile`, and `site/`. These three cross that line:

| Pull request | Path |
| --- | --- |
| #951 | `site/public/docs/zh/start.html`, `…/subscriptions.html` |
| #1020 | `ci` — `.github/` |
| #1157 | `ci` — `.github/` |

## What went wrong, so it does not again

- `git apply` aborts the **whole** patch when one file's hunks fail. Use
  `--exclude='registry.json'` to land the package, then add the registry entry
  by hand and check the entry count.
- A patch carrying images cannot be applied from the diff API: they arrive as
  `GIT binary patch` that `git apply` cannot rebuild. Take the PR's tarball
  (`refs/pull/<n>/head`). The tell is "apply succeeded" with zero files on disk.
- Before inserting or deleting a method inside a class, `grep -c` that it is not
  already there. `node --check` saying a private field is "not in an enclosing
  class" means the **class boundary** broke, not the field.
- A test that is red both with and without the patch is the environment. Measure
  the baseline before calling it a regression.
- Commit messages: use `-F <file>`. A backtick in `-m` is executed by the shell.
