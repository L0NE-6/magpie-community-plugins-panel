#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const output = path.join(root, "panel", "pr-audit.json")
const query = `query($cursor: String) {
  repository(owner: "magpie-community", name: "plugins") {
    pullRequests(states: OPEN, first: 50, after: $cursor, orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
      nodes {
        number
        title
        isDraft
        mergeable
        mergeStateStatus
        reviewDecision
        updatedAt
        createdAt
        changedFiles
        additions
        deletions
        baseRefName
        headRefName
        isCrossRepository
        author { login }
        labels(first: 20) { nodes { name } }
        closingIssuesReferences(first: 20) { nodes { number title } }
        commits(last: 1) {
          nodes {
            commit {
              oid
              statusCheckRollup { state }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`

function graphql(cursor) {
  const args = ["api", "graphql", "-f", `query=${query}`]
  if (cursor) args.push("-f", `cursor=${cursor}`)
  let lastError
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const source = execFileSync("gh", args, {
        encoding: "utf8",
        env: process.env,
        windowsHide: true,
        timeout: 90_000,
        stdio: ["ignore", "pipe", "pipe"],
      })
      return JSON.parse(source)
    } catch (error) {
      lastError = error
      if (attempt < 8) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000)
    }
  }
  throw lastError
}

function normalize(pr) {
  const check = pr.commits?.nodes?.[0]?.commit?.statusCheckRollup?.state || null
  const mergeable = String(pr.mergeable || "UNKNOWN")
  const mergeState = String(pr.mergeStateStatus || "UNKNOWN")
  let action = "needs-review"
  if (pr.isDraft) action = "draft"
  else if (mergeable === "CONFLICTING" || mergeState === "DIRTY") action = "needs-rebase"
  else if (mergeable === "MERGEABLE" && ["SUCCESS", null].includes(check)) action = "candidate"
  else if (mergeable === "MERGEABLE" && ["FAILURE", "ERROR"].includes(check)) action = "fix-ci"
  else if (mergeable === "MERGEABLE") action = "verify"
  return {
    number: pr.number,
    title: pr.title,
    draft: pr.isDraft,
    mergeable,
    mergeState,
    reviewDecision: pr.reviewDecision || null,
    checkState: check,
    action,
    updatedAt: pr.updatedAt,
    createdAt: pr.createdAt,
    changedFiles: pr.changedFiles,
    additions: pr.additions,
    deletions: pr.deletions,
    base: pr.baseRefName,
    head: pr.headRefName,
    crossRepository: pr.isCrossRepository,
    author: pr.author?.login || null,
    labels: (pr.labels?.nodes || []).map((label) => label.name),
    linkedIssues: (pr.closingIssuesReferences?.nodes || []).map((issue) => ({
      number: issue.number,
      title: issue.title,
    })),
    headOid: pr.commits?.nodes?.[0]?.commit?.oid || null,
  }
}

function countBy(items, field) {
  const counts = {}
  for (const item of items) counts[item[field]] = (counts[item[field]] || 0) + 1
  return counts
}

async function main() {
  const items = []
  let cursor = null
  let total = null
  do {
    const response = graphql(cursor)
    const page = response?.data?.repository?.pullRequests
    if (!page || !Array.isArray(page.nodes)) throw new Error("GitHub GraphQL returned no pull request page")
    total = page.totalCount
    items.push(...page.nodes.map(normalize))
    cursor = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null
  } while (cursor)

  const unique = [...new Map(items.map((item) => [item.number, item])).values()]
  const audit = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repository: "magpie-community/plugins",
    total,
    fetched: unique.length,
    summary: {
      action: countBy(unique, "action"),
      mergeable: countBy(unique, "mergeable"),
      mergeState: countBy(unique, "mergeState"),
      checks: countBy(unique, "checkState"),
      draft: unique.filter((item) => item.draft).length,
      linkedIssues: unique.reduce((count, item) => count + item.linkedIssues.length, 0),
    },
    candidates: unique
      .filter((item) => item.action === "candidate")
      .sort((left, right) => left.changedFiles - right.changedFiles || left.number - right.number),
    items: unique,
  }
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(audit, null, 2)}\n`, "utf8")
  console.log(
    `panel-pr-audit: ${unique.length}/${total} open PRs; ${audit.candidates.length} candidates; wrote ${output}`,
  )
}

main().catch((error) => {
  console.error(`panel-pr-audit: ${error.stack || error.message}`)
  process.exitCode = 1
})
