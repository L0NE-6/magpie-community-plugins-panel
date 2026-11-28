# Host contract vs plugin behaviour

Five fields in magpie's provider contract already express what the plugins in this repo invent a value
for. Each row is a fact read in `yetone/magpie`, the issues it explains, and who has to change.

| host field | where | what it already says | issues it explains | who changes |
| --- | --- | --- | --- | --- |
| `Quota.Balance string` (and `SubscriptionQuota.Balance`) | `internal/provider/quotas.go:79` | a balance is **text**, so "no balance" and `"0"` differ by construction | `#1254`, `#1299`, `#1434` | plugin |
| `QuotaSpan.Text bool` + `Display` | `quotas.go:127` | "the window is its `Display` alone, `Used` and `Remaining` are no reading" | `#1254`, `#1341` | plugin |
| `QuotaSpan.RunsOutAt` / `RunsOut` | `quotas.go:127` | when the soonest of what is left is lost, apart from the reset | `#1414` | plugin (fill it) |
| `QuotaWindow.Pool` + `PooledWindows` | `internal/provider/google.go:1580` | windows drawing on one allowance are grouped and rendered `"Gemini · 7 days"` | `#1414` (half) | plugin (set it) |
| `noShare` / `partial` | `subscription_usage.go:175` | "its `Used` is 0 for want of a share said, not a reading at 0" (`#4825`); a reading may leave windows out | `#1254`, `#1434` | **nobody — it is unexported** |

## The two places this is not a plugin-only fix

1. **`noShare` is unexported.** The host knows how to say "0 because nothing was said", but a plugin cannot
   set it. So a plugin's only correct move for a missing reading is `Text: true` or omitting the window —
   and therefore **a host change is worth proposing**: a plugin-settable "no numeric reading" per window.
   This is the one place where the seven invented-zero issues need `yetone/magpie`, not the plugin.
2. **`Remaining` is computed, not read**: `Remaining: max(0, 100-w.Used)` in `quotaReport`. A plugin's
   invented `Used: 0` becomes `Remaining: 100` — a full allowance. The distinction is lost **before** the
   value reaches the host, so no host-side check can recover it; the plugin has to stop sending the `0`.

## What this table is for

Before proposing anything to either project, check this table: **if the field exists, the proposal is a
plugin change; if it is unexported, the proposal belongs upstream.** Two of the issues I answered earlier
(`#1254`, `#1434`) would have been filed in the wrong repository without it.

## Confidence

Every row was read in the current `main` and quoted with its file and line in `CODE-MAP.md`. The mapping
from field to issue is my reading of the issue text — `#1414` in particular says it wants cross-provider
grouping, which `Pool` does **not** provide; that half stays host-side and is stated as such.

## The other contract: what one registry entry may contain

`scripts/registry.mjs` validates `registry.json` against what magpie's reader (`internal/plugin/market.go`)
takes, and its header says why the rules are strict: the reader unmarshals the whole file into typed
fields, so **one value of the wrong type loses every listing, not just its own**.

| rule | exact shape | failure seen in practice |
| --- | --- | --- |
| file size | ≤ **1 MiB** (`1 << 20`) — "more than magpie fetches" | — |
| shape | JSON object, `version === 1`, `plugins` a non-empty array | — |
| entry fields | **only** `package`, `name`, `icon`, `providers`, `community`, `replaces`, `kind`, `summary` — any other key is an error | — |
| `package` | `^(@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$`, ≤ 214 chars, **no duplicates** | `#1269`: `github:ygq-future/magpie-prompt-guard` is not an npm name |
| `name` | non-empty text | — |
| `kind` | if present, one of `middleware` / `hooks` / `agent` / `tools` / `page` — **a provider has none** | — |
| `community` | if present, a **boolean** (`"true"` fails) | — |
| `replaces` | if present, non-empty text naming a **subscription id** | — |
| `providers` | if present, non-empty array of non-empty strings | — |
| `icon` | if present, non-empty; if it contains `:` or `/` it must start with `https://` or `data:image/` | — |
| `summary` | **object with `en` and `zh`, both non-empty strings** | `#1449`, `#1529`, `#603`, `#992`: no entry written at all |

**The two rows that cost the most work**: `kind` is what the page sorts by ("an unknown kind lists a
middleware or an agent as a provider"), so getting it wrong misfiles the plugin rather than hiding it; and
`summary` requiring **both** languages is why a missing entry cannot be filled in from the package — the
`magpie` block in those packages carries no name or summary to copy.

## What a package must export — `opencode2Problems` in full

`scripts/check.mjs` loads each package twice: once as OpenCode 1.x and once as 2.x. The 2.x half is
`opencode2Problems`, and its rules are exact:

| rule | exact shape |
| --- | --- |
| entry point | `exports["."]` (a bare string, or the object's `.import` / `.default` / `.`), else `main`; not a string → `exports["."] is not a file` |
| default export | `{ id: <non-empty string>, setup: <function> }` — **or `effect: <function>`** instead of `setup` |
| the adapter | if the package ships `opencode2.mjs`, it must be **byte-for-byte** `scripts/opencode2.mjs` ("copy it again" is the message) |
| `files` | must list the entry, `opencode2.mjs` when present, **and** `main` — "`<name>` is not in files" otherwise |

**A correction to what I wrote in earlier answers**: I said the default must carry `setup`; the checker
accepts `setup` **or** `effect` (`typeof d.setup !== "function" && typeof d.effect !== "function"`). Both
satisfy it.

**The `files` rule is the one that bites outside 2.x too.** I hit it on `#659` (`page/layouts.js` newly
loaded by `index.html` but not added to `files`, caught by the package's own `package-files.test.mjs`).
The rule is the same in both places: **a file the package ships must be named in `files`**, and the checker
enforces it for the entry, the adapter and `main`.

## Which packages are skipped, and why

Two skips in the main loop, both deliberate:

```js
if (pkg.magpie?.middleware || pkg.magpie?.gateway || pkg.magpie?.agent || pkg.magpie?.hooks) continue
if (pkg.magpie?.page && !pkg.main && !pkg.exports) continue
```

- **middleware, gateway, agent and hooks plugins have no OpenCode face at all** — "their own tests check
  them". That is why `#312` (middleware) and `#270` (gateway) applied cleanly while `#531` and `#73`
  (providers) did not: **the rule is about what the plugin is, not how big it is**.
- **A page with `main` or `exports` is *not* skipped** — it is checked for a 2.x face, which surprises
  page authors who think pages are exempt.

## The 2.x adapter — 620 lines, and what it deliberately loses

`scripts/opencode2.mjs` is the one file the checker requires byte-identical everywhere, and its header states
what the 1.x face looks like to 2.x. Four things worth knowing before writing a 2.x-compatible package:

1. **How the 1.x plugin is found** (`pluginsOf`): a `default` carrying `server`, `id` or `tui` **is** the one
   plugin; otherwise every exported function, and every exported object with a `server`. So a package that
   exports a plugin both ways gets it once, not twice.
2. **The SDK becomes pin-specified** (`packageOf`): `@ai-sdk/openai-compatible` → `aisdk:@ai-sdk/openai-compatible@2.0.41`,
   other `@ai-sdk/*` → `ai-v6`. The comment says why a version matters: it keeps 2.x from swapping `@ai-sdk/*`
   for its **native providers, "which never call the sdk hook below"** — an unpinned name silently loses the hook.
3. **The key is a placeholder** (`PLACEHOLDER`): the SDK is built with `opencode2-v1-key` so that the account's
   own key can go on each request in its place (`wrapFetch`) — "a key read when the SDK was made can't go out
   after the account changed".
4. **Values are coerced with a zero fallback**: `int(n, 0)` → 0 for non-finite or negative, `money(n)` → 0 when
   not finite or negative. **This is the same "invent a 0" pattern, inside the repo's own shared adapter** —
   and unlike the host's `Text`/`noShare` vocabulary there is no "unknown" channel here. A package that needs
   to say "no reading" on the 2.x face has to do it before the adapter coerces.

### What the adapter does not carry

The header of `opencode2.mjs` lists the 1.x surface 2.x has no place for: `chat.headers`, `chat.params`
(2.x's sdk hook does not carry the session), magpie's `usage` and `checkin`, tools and events. So a provider
whose value depends on those (a usage card, a check-in, a per-request header) is **1.x-only by
construction** — which is worth stating in a package README rather than discovering at review.

