import { expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { checkPanelDirectory } from "./panel-check.mjs"
import { renderPriority } from "./panel-priority.mjs"
import {
  buildPanel,
  createFixturePanel,
  fetchPaginated,
  makeRepository,
  matchTitlePrefix,
  writePanelFiles,
} from "./panel-sync.mjs"

async function temporaryDirectory() {
  return mkdtemp(path.join(tmpdir(), "panel-test-"))
}

test("fixture panel round-trips through the checker", async () => {
  const directory = await temporaryDirectory()
  try {
    await writePanelFiles(createFixturePanel(), directory)
    const result = await checkPanelDirectory(directory)
    expect(result.errors).toEqual([])
    expect(result.status.summary.issueCount).toBe(4)
    expect(result.status.summary.pullCount).toBe(3)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("pagination follows Link headers without fetching past the limit", async () => {
  const calls = []
  const fetchImpl = async (url) => {
    calls.push(new URL(url).searchParams.get("page"))
    if (calls.length === 1) {
      return new Response(JSON.stringify([{ number: 1 }]), {
        headers: {
          link: '<https://api.github.com/repos/acme/plugins/issues?page=2>; rel="next"',
        },
      })
    }
    return new Response(JSON.stringify([{ number: 2 }]), { headers: { link: "" } })
  }
  const rows = await fetchPaginated(makeRepository("acme/plugins"), "issues", {
    fetchImpl,
    perPage: 2,
    maxPages: 2,
  })
  expect(calls).toEqual(["1", "2"])
  expect(rows.map((row) => row.number)).toEqual([1, 2])
})

test("a Chinese full-width colon maps a package prefix", () => {
  const catalog = new Map([
    ["qoder", { name: "@magpie-community/opencode-qoder-auth", directory: "packages/qoder" }],
  ])
  expect(matchTitlePrefix("qoder：请增加签到清洗", catalog)).toEqual({
    package: "@magpie-community/opencode-qoder-auth",
    packageDirectory: "packages/qoder",
    titlePrefix: "qoder",
  })
})

test("panel excludes pull requests from issues and carries their comment count", () => {
  const common = {
    created_at: "2026-11-01T00:00:00Z",
    labels: [],
    user: { login: "maintainer" },
  }
  const panel = buildPanel({
    repository: "acme/plugins",
    generatedAt: "2026-11-25T12:00:00Z",
    issueItems: [
      {
        ...common,
        number: 1,
        title: "[P1] qoder: login fails",
        comments: 3,
        updated_at: "2026-11-25T10:00:00Z",
        labels: [{ name: "P1" }],
      },
      {
        ...common,
        number: 2,
        title: "qoder: fix login",
        comments: 8,
        updated_at: "2026-11-25T11:00:00Z",
        pull_request: {},
      },
    ],
    pullItems: [
      {
        ...common,
        number: 2,
        title: "qoder: fix login",
        draft: false,
        updated_at: "2026-11-25T11:00:00Z",
      },
    ],
  })
  expect(panel.issues.map((issue) => issue.number)).toEqual([1])
  expect(panel.issues[0].priority).toBe("P1")
  expect(panel.pulls[0].comments).toBe(8)
})

test("checker rejects a generated status file after mutation", async () => {
  const directory = await temporaryDirectory()
  try {
    await writePanelFiles(createFixturePanel(), directory)
    const statusPath = path.join(directory, "status.json")
    const status = JSON.parse(await readFile(statusPath, "utf8"))
    status.issues[0].priority = status.issues[0].priority === "P3" ? "P2" : "P3"
    await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`)
    const result = await checkPanelDirectory(directory)
    expect(result.errors.length).toBeGreaterThan(0)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("curated triage seed has unique, ranked issue and pull-request queues", async () => {
  const seed = JSON.parse(await readFile(new URL("../panel/triage-seed.json", import.meta.url), "utf8"))
  const status = JSON.parse(await readFile(new URL("../panel/status.json", import.meta.url), "utf8"))
  expect(seed.schema_version).toBe("panel-triage-seed/v1")
  expect(seed.repository.full_name).toBe("magpie-community/plugins")
  expect(seed.summary.open_issues).toBe(status.summary.issueCount)
  expect(seed.summary.open_prs).toBe(status.summary.pullCount)
  expect(seed.summary.open_total).toBe(seed.summary.open_issues + seed.summary.open_prs)
  expect(seed.priority_issues).toHaveLength(seed.summary.priority_issue_count)
  expect(seed.priority_prs).toHaveLength(seed.summary.priority_pr_count)

  for (const [name, items] of [
    ["priority_issues", seed.priority_issues],
    ["priority_prs", seed.priority_prs],
  ]) {
    expect(new Set(items.map((item) => item.number)).size).toBe(items.length)
    expect(items.map((item) => item.rank)).toEqual(items.map((_, index) => index + 1))
    expect(items.every((item) => ["P0", "P1", "P2", "P3"].includes(item.risk))).toBe(true)
    expect(items.every((item) => Number.isSafeInteger(item.number) && item.number > 0)).toBe(true)
    expect(name.length).toBeGreaterThan(0)
  }
})

test("priority markdown is generated from the curated seed", async () => {
  const seed = JSON.parse(await readFile(new URL("../panel/triage-seed.json", import.meta.url), "utf8"))
  const expected = renderPriority(seed)
  const actual = await readFile(new URL("../panel/priority.md", import.meta.url), "utf8")
  expect(actual).toBe(expected)
})
