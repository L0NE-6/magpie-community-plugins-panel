# What magpie does with an upstream that misbehaves

Four classes, from the code that decides them. A provider plugin's wording is what puts its failure in one
class or another, and the class decides whether the request is retried, fails, or is silently accepted.

| class | decided by | what puts a body here | what magpie does |
| --- | --- | --- | --- |
| **transport** — never reached the vendor | `transportFailed` (`fallback.go:2368`) | `dial tcp`, `connectex`, `wsarecv`, `i/o timeout`, `TLS handshake timeout`, `context deadline exceeded`; **`errEndedShort`**; **`didNotStream`**; magpie's own words | **asks again** — the request may well fit |
| **overflow** — past the window, said generically | `unsaidStatus` (`fallback.go:2346`), keyed by **plugin** | `devin` 500/502/503/504; `qoder`, `qoder-cn`, `workbuddy`, `workbuddy-ai` 400/413/422; `factory` 413 | treats it as a **size** problem, not a vendor refusal |
| **truncated** — started, stopped short | `errEndedShort` (`continuation.go:744`, fails at `:861`) | clean close with no `stop_reason`/`message_stop` (Anthropic) or no `response.completed` (Responses) | `<provider>: the reply ended before it was complete`, **502** when the headers are not out yet |
| **answer** — the vendor replied | everything else | any status/message the vendor actually sent | **fails with the vendor's own words**; no retry |

## What this means for the issues already filed

- **`#1635`** — `200 {"code":0,"msg":""}` surfaces as **`did not stream`**, which is in the **transport** list,
  so the request is asked again. Against a vendor that answers the same envelope every time, that is pure
  waste. The fix is the wording, not a retry policy.
- **`#1470`** — `429 {"code":1309"…expired"}` is an **answer** (zcode is not in `unsaidStatus`), so it fails
  fast. That is correct for an expired plan, and it means the plan/version mismatch is the real bug.
- **`#1361`** — `200` with no `googleSearch` evidence is an **answer** too: nothing is retried and nothing is
  flagged, which is exactly the silent pass the issue describes. The plugin has to notice it.
- **`#1480`** — a reply that ends short is **truncated**, and `chatEncoder.finish()` (with its `[DONE]`) never
  runs on that path. The client sees a bare close because the host could no longer send a 502.

## The rule a plugin author can take from this table

**Say what the vendor said.** A plugin that rewords a vendor's refusal into "did not stream" moves the
failure from *answer* (fail, show it) to *transport* (retry, hide it) — and retrying a vendor that has already
answered is the one class of retry that can never succeed. Conversely, a genuine transport failure worded as a
vendor message would fail a request that would have worked on a second try.
