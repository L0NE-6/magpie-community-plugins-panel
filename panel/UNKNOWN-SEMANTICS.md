# Unknown is not zero

Seven issues in this repository are the same mistake wearing different hats: **when a value was
missing, the plugin filled in a concrete one.** Each fill looks harmless and each one lies to the user
in a way that changes what they do next.

| issue | package | the value it invents | what the user sees | what is actually true |
| --- | --- | --- | --- | --- |
| `#1254` | loomy | used = 0% | "plenty left" | upstream stopped sending `dailyLimitPoints` |
| `#1341` | agy-cli | account type = `API …` | "I am on API billing" | the type was not recognised |
| `#1299` | raccoon | a plausible spend | a number that does not match | price, usage or multiplier was missing |
| `#1434` | atomcode | plan present, used = 0 | "quota left", and `planNeedsClaim()` false → the auto-claim skipped | the plan is a **placeholder**, the entitlement is not active |
| `#1303` | inkstone | cap = 8 images | "this plan only takes 8" | the platform now takes 100 |
| `#1365` | kiro | thinking budget = 20k–50k | "I asked for 50k" | the model caps lower, and upstream truncates **silently** |
| `#1406` | gcp-ai | project = usable | login succeeds | that account may have no access to it |

**The rule, in one line:** if the value is not known, say unknown and let upstream refuse — its refusal
carries the real reason, and the plugin's invention does not.

## Why the invention is worse than an error

An error stops the user. An invented value **sends them in the wrong direction**:

- `#1254` and `#1434` make the account look *available*, so routing picks it and the request fails anyway
  (and in `#1254`'s case, `Least used first` will prefer the account whose usage is unknown);
- `#1303` and `#1365` make a *working* request look impossible, so the user stops using a feature that
  would have worked;
- `#1406` can bind two accounts to one project, which mixes their quota as well as their failures.

## The change, per field

1. **`auth.usage`**: every numeric field is either a number **and** its unit/scale, or explicitly
   `unknown`. No zero, no "not used yet", no `display: 0%`.
2. **`planNeedsClaim()`-style predicates**: when the plan is a placeholder, answer "needs claim", not
   "nothing to do". Being wrong here silently skips the one action that would fix the account.
3. **Caps and budgets** (`#1303`, `#1365`): take the cap from the plan/model metadata; when it is absent,
   **do not clamp** — send and let upstream decide.
4. **Account type** (`#1341`): it is known at sign-in (the method that was used). Read it from there, not
   from the usage response.
5. **Machine-wide configuration** (`#1406`): a project inherited from the environment or from provider
   options is a **guess about the new account**. Probe once at sign-in, then bind or refuse — and log
   where the value came from.

## What this does not fix

Routing policy. `Least used first` needs a comparable number; an `unknown` account cannot be ranked, so
the routing layer has to decide what to do with unknowns (skip them, or put them last). That is a host
decision, and worth stating explicitly rather than letting a fake zero make it quietly.
