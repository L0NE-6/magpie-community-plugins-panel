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


### Pools already exist on the window, and are rendered by the host

```go
// internal/provider/google.go:1580 — PooledWindows
// PooledWindows are ws as a page of text shows them: a pool's own windows,
// named with their pool ("Gemini · 7 days"), in place of the per-model
// windows drawing on it; ws as it is when it has no pool.
```

A plugin sets `QuotaWindow.Pool` on the windows that draw on a shared allowance, and the host collapses
the per-model windows into the pool's, naming them `"Gemini · 7 days"`. That is precedent for `#1414`'s
"free resources as one pool": the vocabulary for grouping windows exists and is already rendered.

**It is not the whole answer**, and the difference matters: `Pool` groups windows **within one plugin's
account** (Gemini's models drawing on one allowance), while `#1414` wants a group across **providers**
(a limited-time credit from vendor A ranking against a free model from vendor B). That cross-provider step
is a routing decision and stays host-side — but the shape to imitate is already in the codebase.


## How magpie tells three kinds of "the upstream stopped" apart

`internal/gateway/continuation.go` names three endings, and where each is raised matters more than what it
says:

| ending | raised at | condition | what magpie does with it |
| --- | --- | --- | --- |
| `errStreamCut` | `continuation.go:709` | the upstream sent an **error event**; the read stops once it is in hand | treated as a cut (`:725`) |
| `errDoneSaid` | `continuation.go:714` | a **Chat** upstream said `[DONE]` — whole by its protocol | ends the read normally (`:725`) |
| `errEndedShort` | `continuation.go:744` | the connection closed **cleanly** without the closing event (Anthropic: no `stop_reason`/`message_stop`; Responses: no `response.completed`) | **fails the reply**: `continuation.go:861-862` builds `"<provider>: the reply ended before it was complete"`, `fallback.go:3759` turns it into **502**, and `fallback.go:2370` matches that phrase as transport-ish, so a fallback may be tried |

**And this is the piece that makes `#1480` understandable**: the `[DONE]` in `chat.go:1828` comes from
`chatEncoder.finish()`, which runs on the **normal** path. A reply that ends short **aborts before
`finish()`**, so the client is left with a stream that stops — the exact symptom the issue reports. It is not
that the host forgot the `[DONE]`; it is that **two different endings reach the client in two different
shapes**: one with the frame, one without.

So the question a fix has to answer is not "should the plugin add `[DONE]`" (the host does), but
**"after a mid-stream abort, should the client get a bare close or a final error frame?"** — and per the table
above, the host can only answer that once it can no longer send a 502, i.e. after the first chunk is out.


## `transportFailed` — why a plugin's wording decides whether a request is retried

```go
// internal/gateway/fallback.go:2368
// transportWords are a failure that never reached a vendor's answer … a request that met one
// may well fit, and is asked again.
func transportFailed(body []byte) bool {
    return transportWords.Match(body) || bytes.Contains(body, []byte(errEndedShort.Error())) ||
        bodyHas(body, didNotStream) || magpieSaid(string(body))
}
```

An error body is a **transport failure — so ask again** — when it matches any of four things:

1. `transportWords`: `dial tcp`, `connectex`, `wsarecv`, `i/o timeout`, `TLS handshake timeout`, `context deadline exceeded`, …
2. `errEndedShort` ("the reply ended before it was complete")
3. **`didNotStream`** — the phrase a provider says when an upstream answered **without a stream**
4. `magpieSaid(...)`

**That third one is the mechanism behind the ZCode family.** `#1635` reports the vendor answering `200 {"code":0,"msg":""}`;
magpie surfaces that as `ZCode did not stream: unexpected reply: …` — and `didNotStream` makes
`transportFailed` say "this never reached the vendor, ask again". So the request **is** retried, against a
vendor that will keep answering the same empty envelope. The waste in `#1470` and `#1639` follows.

**So the fix is not "retry or do not retry" in the plugin — it is that this reply must not be worded as
`didNotStream`.** A vendor's own refusal (`code:1309`, `code:0`) is an **answer**, and belongs with
`unsaidStatus`-style classification, not with transport.

### `unsaidStatus` is keyed by plugin, not provider id

```go
var unsaidStatus = map[string][]int{
    "devin": {500, 502, 503, 504}, "qoder": {400, 413, 422}, "workbuddy": {400, 413, 422},
    "factory": {413}, …
}
```

These are statuses a vendor returns **for a request past its model's window while saying nothing about
length** — a size problem wearing a generic status. The comment is explicit about the key: **"Keyed by the
plugin, never by the provider's id, which a user's own provider may share."** ZCode is not in the table, so
its `429` is read as the vendor's answer and fails the request — which is right for an expired plan, and is
why `#1470` fails fast rather than retrying forever.


## Routing: backoff comes from the vendor's own words, and "used" is the host's count

Two facts in `internal/gateway/routing.go` (3,011 lines) that correct two things I said earlier:

```go
// routing.go:316
func creditBackoff(id string, header http.Header, body []byte, now time.Time) (d time.Duration, by string, n int, …)
const quotaRest   = 15 * time.Minute   // out of quota, with no word of when it resets
const longestQuota = 8 * 24 * time.Hour
```

**1. The host already backs off, from the vendor's own reset hint.** `creditBackoff` reads the response's
header and body, and falls back to `quotaRest` (15 minutes) when the vendor says nothing, up to 8 days. So
`#1342`'s "renewal retried every 3–4 seconds" **cannot be the gateway's retry** — the gateway would wait 15
minutes. That 3–4 second loop is the **plugin's own** renewal loop, which confirms my earlier prescription
(add backoff **there**) and rules out "the gateway is retrying".

**2. "Used" in routing is the host's own token count, not the plugin's quota.** `served(rest, key string,
tokens int)` records what the gateway served per account and model, and `tokenUse.now(t)` turns it into a
rate. So a routing order that prefers "least used" is ranking **observed tokens**, not `Quota.Remaining`.

**That corrects my warning on `#1254`.** I wrote that an account whose usage is `unknown` would be treated as
"least used" and picked first. **It would not** — the ranking does not read the plugin's quota at all. The
`0%` is still a display lie and still worth fixing, but it does not distort routing. Saying otherwise
overstated the damage.

## What this pass is not

It is a **count and a skeleton**. The next pass has to read those files, and the honest way to show that
reading happened is behaviour: naming the function that owns a decision, the line a fix goes on, the test
that would fail without it. That is what `LINE-FIXES.md` and `SESSION-IDENTITY.md` already do for the
plugins repo, and it is the standard the other two should be held to.
