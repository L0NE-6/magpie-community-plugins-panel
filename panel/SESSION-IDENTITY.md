# Four issues, three assumptions about a conversation

`agy-cli` decides whether a request belongs to the live session by comparing it with what it sent last
time. That comparison rests on three assumptions, and a client or a host breaks one of them on its own.
Because each breaks a *different* one, fixing one only stops one client.

| assumption | where it lives | broken by | issue |
| --- | --- | --- | --- |
| a conversation is identified by hashing `system` + `messages[0]` | `convKey` | a middleware that compresses or injects into `system` and early messages | `#1259` |
| the history we get back is byte-for-byte what we sent | `historyMatches` | a host that replaces a tool result with a summary | `#1490` |
| a `tool_use` keeps its `id` | result/call correlation | a client that renames ids **and** rewrites an earlier message | `#1412` |
| a second `tool_result` for a consumed call is a conflict | `reject_active` | a client retry or a second window | `#1398` |

## The change, one per row

1. **`convKey`** — hash only what nobody rewrites: the user's own opening text, or a client-supplied
   session id when there is one. If `system` must be part of it, strip the injected blocks first.
   (`#1259`)
2. **`historyMatches`** — compare **shape**, not bytes: turn count, role order, tool-call sequence. A
   shorter tool result is the host's doing, not a new conversation. Keep the byte comparison for the
   parts the host never touches. (`#1490`)
3. **Correlation** — key it on `tool name + arguments hash`, and treat the id as a fast path that may
   change. A renamed id then still finds its result. (`#1412`)
4. **`reject_active`** — dedupe consumed `tool_result`s by id first and continue; for a live turn plus a
   new request, end the turn and take it (a new `dropReason`), rather than answering 409. Reserve 409 for
   two writers that genuinely cannot be ordered, and say what is running. (`#1398`)

## Why these go together

Each of the four is a client or host being reasonable: compressing context, summarising a tool result,
renaming ids while pruning, retrying a turn. The bridge currently assumes none of that happens. Fixing
them one at a time is four separate reports of the same surprise; fixing the four assumptions together
means the next client variant does not produce a fifth.

## What to test, and it can be tested here

The package's fake agy can drive all four, and the suite already has the shape for it
(`test/repeat-batch.mjs`, `test/prefill.mjs`):

| scenario | assertion |
| --- | --- |
| every turn rewrites `system` | `convKey` stays stable, no `drop_live` |
| a tool result comes back shorter | no `history_mismatch`, session kept, cache preserved |
| ids renamed + an earlier message pruned | the result still matches its call |
| the same `tool_result` arrives twice | ignored, no 409 |
