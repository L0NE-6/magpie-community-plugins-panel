# Maintenance Dashboard

`panel/index.html` is a dependency-free static dashboard for the generated
upstream issue and pull-request snapshot.

It reads:

- `status.json` for the full open-item index;
- `triage-seed.json` for the curated priority queue.

The page is designed to be published from the `panel/` directory. Upstream
links remain authoritative; the dashboard never closes, merges or labels an
upstream item by itself.
