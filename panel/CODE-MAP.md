# Code map — measured, not described

First pass for understanding the three upstreams before touching their code. Everything below is counted
from the checkouts (`git ls-files`), so it is fact, not impression.

| repo | files | what dominates | shape |
| --- | --- | --- | --- |
| `yetone/magpie` | **11,077** | **7,042 `.go`**, 1,708 `.cjs`, 660 `.webp`, 392 `.html`, 280 `.svg` | one Go program: **`internal/` 9,644 files**, `site/` 1,260 (docs site), `third_party/`, `build/`, and 23 files under `plugins/` |
| `magpie-community/plugins` | **2,954** | 1,112 `.mjs`, 719 `.json`, 285 `.ts`, 194 `.js` | **`packages/` 2,921 files** — one directory per plugin, plus `scripts/`, `skills/`, a single `registry.json` |
| `Gyl1219/magpie-providers-hub` | **91** | 66 `.mjs` | **`tests/` 35 files against `src/` 20** — the most test-dense of the three, ~1.75 test files per source file |

## What each shape implies for working on them

**magpie** is a Go monolith behind a Wails GUI. The 1,708 `.cjs` files are the GUI's own test suite (run
with `node --test` + Playwright), not application code; the application is `internal/`. Anything touching
routing, providers or usage is a Go change with `go test`, and the GUI needs `gtk4`/`webkitgtk-6.0` to
build — absent on this box, which is why GUI issues here were judged on their Go half only.

**plugins** is a monorepo of independent packages: each has its own `package.json` with a `magpie` block
(`agent` / `page` / `tools` / `hooks` / `middleware` / `gateway` / none-for-a-provider), its own tests, and
one entry in the shared `registry.json`. So "learning the codebase" is mostly learning **six package
shapes and their hooks**, then the per-vendor protocol. The registry and `scripts/check.mjs` define the
contracts a package must satisfy.

**providers-hub** is the easiest to hold in one head: 20 source modules, 35 test files, one `aggregate.mjs`
that wraps per-vendor channels, and a `page/` for the UI. Its `providerIdOf(channel)` is the design
decision that made the aggregate behave like separate providers.

## What to read first, per repo

| repo | read | why |
| --- | --- | --- |
| magpie | `internal/gateway/` → `internal/provider/` → `internal/usage/` | request path, model catalog, accounting — where most issues land |
| plugins | `scripts/check.mjs`, `scripts/registry.mjs`, then one package of each `magpie` kind | the contracts, then the six shapes |
| providers-hub | `src/aggregate.mjs`, `src/shared.mjs`, `tests/setup.mjs` | the wrapper, the transport, and how tests drive a fake vendor |


## magpie's provider contract — and what it proves about the "fake zero" family

`internal/provider/` is **1,078 Go files, 232,407 lines** (`models.go` 4,649, `group.go` 2,802,
`provider.go` 2,757, `account.go` 2,108, `logins.go` 2,056, `balance.go` 1,845, `google.go` 1,841).
Too much to read whole; the file that answers the question is `quotas.go`.

```go
// internal/provider/quotas.go:79
type Quota struct {
    Provider string
    Name     string
    Kind     string   // subscription, plan (bought with a key) or balance (a key's money)
    Windows  []QuotaSpan
    Balance  string   `json:"balance,omitempty"`      // ← a string, not a float
    Error    string   `json:"error,omitempty"`
    AsOf     *time.Time `json:"asOf,omitempty"`       // when the cached reading was taken
    ReadDeferred bool   `json:"readDeferred,omitempty"` // "no request made", not "failed"
    ReadError    string `json:"readError,omitempty"`    // why AsOf stands in for failed
    ReadAt       *time.Time
    Until        *time.Time
    …
}
```

**The host already has the vocabulary for "I do not know":**

- `Balance` is a **string**, so "no balance" and `"0"` are different values by construction;
- `AsOf` / `ReadAt` / `ReadDeferred` / `ReadError` / `Error` distinguish **stale**, **not asked**, and **failed**
  — three states the cards can render differently.

So the seven "invented a zero" issues (`#1254`, `#1299`, `#1341`, `#1434`, `#1303`, `#1365`, `#1406`) are
**entirely a plugin-side choice**: the plugin sends `"0"` or a plausible number where the host was ready to
carry "unknown", "stale" or "failed". `UNKNOWN-SEMANTICS.md` said the capability existed in the plugins;
this says the **host expects it too** — a plugin that sends `0` is discarding a contract, not filling a gap.

That also bounds the fix: no host change and no new field is needed for those seven; only the plugins' output.


### `QuotaSpan` — two fields that answer two open issues outright

```go
// internal/provider/quotas.go:127
type QuotaSpan struct {
    Unlimited bool
    Name      string
    Used      float64
    Remaining float64
    Display   string    // the vendor's own count, "1.2k / 3k"
    // Text: the window is its Display alone, Used and Remaining no reading
    Text      bool
    Lane      string
    Amount, Limit float64
    Unit, Pool    string
    // RunsOutAt is when the soonest of what is left is lost, apart from the reset
    RunsOutAt *time.Time
    RunsOut   float64
    …
}
```

1. **`Text: true` is the sanctioned way to say "no numeric reading".** The comment is explicit: the window
   is its `Display` alone, `Used` and `Remaining` are not a reading. So `#1254`'s false `0%` is not a gap
   the host lacks — the plugin should send the vendor's own text with `Text: true` instead of computing a
   percentage from a missing denominator.
2. **`RunsOutAt` / `RunsOut` already exist on the window.** `#1414` asked for expiry to be part of routing so
   "use before expiry" can rank free resources; the host field is there (`RunsOutAt` is when the soonest of
   what is left is lost, apart from the reset), and the issue's own note says `#1157` already populates it
   for one vendor. **The work on `#1414` is populating an existing field in the other plugins, not building
   a pool.**

Both are the same shape as the `Balance string` finding above: the contract already carries the answer, and
the plugin is not using it.


### The line that turns a missing reading into "100% left"

`quotaReport` in `internal/provider/quotas.go` builds every card by copying the plugin's
`SubscriptionQuota` through — `AsOf`, `ReadAt`, `ReadDeferred`, `ReadError`, `Error`, `Balance` all pass
straight from the plugin. Then, for each window:

```go
Remaining: max(0, 100-w.Used),
```

**`Remaining` is computed from `Used`, not read from the vendor.** So a plugin that sends `Used: 0` because
the denominator was missing is rendered as **`Remaining: 100`** — the host has no way to tell "used none"
from "did not know", because it derives one from the other on this line.

That is `#1254`'s `0%` and `#1434`'s "quota left" **mechanically**, not as a vibe: the invented `0` is
turned into a *full* allowance by the host. It also means the fix must be on the plugin side — no host
change can recover a distinction that was already lost before the value arrived (`Text: true` or an absent
`Used` are the two ways to keep it).


### The host already knows this class — and calls it `noShare`

`internal/provider/subscription_usage.go:175` is the struct a plugin actually populates, and just above it
sits a flag the maintainer added for exactly the problem the seven issues describe:

```go
// noShare is set on a window set aside whose used the plugin left out:
// its Used is 0 for want of a share said, not a reading at 0, so quota
// history keeps no line for it (#4825). The card still tells the row's
// text and routing still sets it aside.
noShare bool
```

And next to it, `partial bool`:

```go
// partial is set on the windows of a reading that may leave some out …
// five hours alone there needn't mean no week.
```

**Three consequences worth stating plainly:**

1. **The distinction is a known upstream concern** (`#4825`), not something a reviewer has to be convinced of.
   The maintainer wrote a flag for "0 for want of a share said, not a reading at 0".
2. **A plugin cannot set it**: `noShare` is unexported, set host-side. So the only correct plugin-side move for
   a missing reading is to **omit the window or send `Text: true` with the vendor's `Display`** — sending
   `Used: 0` cannot be distinguished, however the plugin meant it.
3. **That also makes a host-side improvement worth proposing**: expose a way for a plugin to say "no numeric
   reading" per window, so `Text`/omit does not have to be the only route. That is a `magpie` change, and it
   is the one place where the fix for the seven issues is not purely plugin-side.

## What this pass is not

It is a **count and a skeleton**. The next pass has to read those files, and the honest way to show that
reading happened is behaviour: naming the function that owns a decision, the line a fix goes on, the test
that would fail without it. That is what `LINE-FIXES.md` and `SESSION-IDENTITY.md` already do for the
plugins repo, and it is the standard the other two should be held to.
