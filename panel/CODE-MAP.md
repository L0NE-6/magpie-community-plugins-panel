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

## What this pass is not

It is a **count and a skeleton**. The next pass has to read those files, and the honest way to show that
reading happened is behaviour: naming the function that owns a decision, the line a fix goes on, the test
that would fail without it. That is what `LINE-FIXES.md` and `SESSION-IDENTITY.md` already do for the
plugins repo, and it is the standard the other two should be held to.
