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
