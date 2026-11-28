# Five issues that are one line each

Found by searching for the **error text** first and following it to the constant or the fallback — the
message is unique, while a constant may be called anything or be inline in an object literal.

| # | package | file:line | what is there now | what it should be |
| --- | --- | --- | --- | --- |
| `#1254` | loomy | `index.mjs:118-119` | `dailyWallet?.amount ?? 0`, `Math.max(0, dailyLeft ?? 0) + Math.max(0, permanent ?? 0)` | missing daily wallet → `undefined`, card says "allowance unknown"; keep `permanent` visible when only `dailyLeft` is missing |
| `#1299` | raccoon | `index.mjs:767` | `Math.floor(Number(item?.points) \|\| 0)` | `Number.isFinite` check; skip the record **and count the skips** so "less than expected" is visibly "missing data" |
| `#1365` | kiro | `index.mjs:938` | `BUDGETS = { low: 10000, medium: 20000, high: 30000, xhigh: 50000, max: 50000 }` | `Math.min(BUDGETS[level], capOf(model) ?? Infinity)`, and write the **requested vs actual** thinking into usage |
| `#1406` | gcp-ai | `index.mjs:29` | `auth.project \|\| options.project \|\| env.GOOGLE_VERTEX_PROJECT \|\| env.GOOGLE_CLOUD_PROJECT` | the order is right; add a **probe at sign-in** that the account can use that project, refuse if not, and name the source in the error |
| `#1303` | inkstone | `lib/preflight.mjs:19` | `IMAGE_LIMITS = { …, count: 8, … }` | take `count` from plan metadata, **do not clamp when unknown**, and stop wording the local constant as a vendor limit |

## Two patterns worth doing once, not five times

1. **`#1254`, `#1299`, `#1434`, `#1303`, `#1365`, `#1406`, `#1341`** are the same mistake: a concrete value
   invented where the truth is unknown. `panel/UNKNOWN-SEMANTICS.md` has the per-field list. Five of those
   packages already say `unknown` in dozens of places — the fix is finding the one path that skips it, and
   the fallbacks above are exactly those paths.
2. **`#1365` has a precedent to copy**: `packages/kiro/cache-unknown.test.mjs` opens with "the plugin said
   `cache_read_input_tokens` 0, and magpie showed `cache 0%`". Same shape, already accepted by this package —
   worth writing the thinking-budget case the same way rather than as a new rule.

## A trap the next issue will hit

Fixing `#1303`'s `count` alone makes **100 images × ~400 KB exceed the same file's `total: 40 MB`**, and the
error will read like an image-count problem. Whatever change goes in should make the two limits legible in
the message ("9 images, 41 MB, over the 40 MB per-request total").
