# What a package change has to pass

Twenty scripts under `scripts/`, of which six decide whether a change is acceptable. Read from their
headers, so this is what the repo actually enforces, not advice.

| script | what it decides | runnable here |
| --- | --- | --- |
| `check.mjs` | loads every package the way OpenCode 1.x and magpie do, and the way 2.x does; validates `registry.json` first; skips `middleware`/`gateway`/`agent`/`hooks` packages and pages without `main`/`exports` | yes — `bun scripts/check.mjs` |
| `registry.mjs` | one entry's exact shape (1 MiB, eight fields, pkgName regex, five kinds, both `en`+`zh`) | yes, through `check.mjs` |
| `bumped.mjs` | **"version stayed the same"** — a change to a package has to move its version | yes |
| `tagged.mjs` / `tagged-kind.mjs` | reads the `magpie-plugin` topic the way magpie does (`internal/plugin/github.go readTagged`), and the kind from a tagged repo | yes (network) |
| `opencode2.mjs` | the 2.x face; must be byte-identical in every package that ships it | yes, through `check.mjs` |
| `proc.mjs` / `sync-proc.mjs` | the generated proc files some packages carry; `sync-proc` regenerates, `proc.test.mjs` asserts they match | yes |

And six that are release or ops, not gates: `new-to-npm.sh`, `publish.sh`, `owner.sh`, `try.sh`, `dist.mjs`
(fetches a package's dist when npm lacks it), `cursor-pi-retry.integration.mjs` (an integration test needing a
`pi-coding-agent` checkout).

## The checklist a change should satisfy, in order

1. **`bun scripts/check.mjs` exits 0.** It covers registry shape, the 1.x load, the 2.x face, the byte
   identity of `opencode2.mjs`, and that `files` names the entry, the adapter and `main`.
2. **The package's own suite passes, compared against `origin/main`.** A red suite on both sides is the
   machine; red only with the change is the change.
3. **`bumped.mjs`'s rule holds**: the version moved. I hit the reverse on `#1435` — a patch whose version
   field was *older* than main's (0.1.110 against 0.1.134), which would have shipped a downgrade.
4. **If it carries generated procs**, `sync-proc.mjs` reproduces them (`#1274` added `src/proc.mjs` and two
   registration lines for exactly this).
5. **If it is a provider**, it needs both faces: the 1.x exports *and* a 2.x `default {id, setup|effect}`
   plus `opencode2.mjs`. Five pull requests are blocked on this and nothing else (`#531`, `#73`, `#802`).

**The single most expensive mistake** is treating `check.mjs` as a formality: it loads the package, so a
missing export, a differing adapter byte, or a file absent from `files` fails there rather than in a
reviewer's browser.
