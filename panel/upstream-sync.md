# Upstream Sync

## Source

`upstream` points to `https://github.com/magpie-community/plugins.git`.

`origin` points to this maintenance fork.

## GitHub Actions Token

Add a repository secret named `PANEL_SYNC_TOKEN` with a fine-grained token that
can write this repository's contents and workflows. The workflow falls back to
`GITHUB_TOKEN`, but GitHub can reject a push that changes workflow files with
that token.

## Branches

- `main`: exact upstream mirror;
- `panel`: maintenance branch and default branch;
- `fix/*`: focused patches;
- `review/*`: PR reproductions.

## Sync Policy

1. Fast-forward `main` from `upstream/main`.
2. Merge `main` into `panel`.
3. Resolve conflicts manually.
4. Run repository and panel checks.
5. Push `main` and `panel` atomically without force.

## Conflict Policy

Conflicts are expected around:

- README banners;
- workflow guards;
- generated panel files;
- package versions changed both upstream and locally.

Do not discard upstream package changes. Rebase local fixes on the new upstream
tree and rerun tests.

## Never

- Never push to `upstream`.
- Never force-push `main` or `panel`.
- Never publish to the upstream npm scope.
- Never overwrite upstream `dist`.
