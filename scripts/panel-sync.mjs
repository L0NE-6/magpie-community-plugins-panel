#!/usr/bin/env node

import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_REPOSITORY = "magpie-community/plugins";
const DEFAULT_API_BASE = "https://api.github.com";
const DEFAULT_WEB_BASE = "https://github.com";
const DEFAULT_PANEL_DIR = "panel";
const DEFAULT_PER_PAGE = 100;
const DEFAULT_MAX_PAGES = 100;

export const PRIORITIES = ["P0", "P1", "P2", "P3"];
export const COMMENT_BUCKETS = ["none", "light", "active", "hot"];
export const UPDATED_BUCKETS = ["24h", "7d", "30d", "older"];

const PRIORITY_RANK = new Map(PRIORITIES.map((priority, index) => [priority, index]));

function envValue(name, fallback) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer, got ${JSON.stringify(value)}`);
  }
  return number;
}

function trimBase(value) {
  return String(value).replace(/\/+$/, "");
}

export function makeRepository(value = DEFAULT_REPOSITORY, options = {}) {
  const source = typeof value === "string" ? value.trim() : "";
  const match = source.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!match) {
    throw new Error(`repository must be owner/name, got ${JSON.stringify(value)}`);
  }
  const apiBase = trimBase(options.apiBase || envValue("GITHUB_API_URL", DEFAULT_API_BASE));
  const webBase = trimBase(options.webBase || envValue("GITHUB_WEB_URL", DEFAULT_WEB_BASE));
  return {
    owner: match[1],
    name: match[2],
    full: `${match[1]}/${match[2]}`,
    apiBase,
    webBase,
  };
}

export function normalizeTimestamp(value, field = "timestamp") {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be an ISO timestamp`);
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) {
    throw new Error(`${field} is not a valid timestamp: ${JSON.stringify(value)}`);
  }
  return new Date(milliseconds).toISOString();
}

function integerField(value, field, { minimum = 0 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new Error(`${field} must be an integer >= ${minimum}, got ${JSON.stringify(value)}`);
  }
  return number;
}

function titleText(value, field = "title") {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be non-empty text`);
  }
  return value.trim();
}

function labelNames(item) {
  if (!Array.isArray(item?.labels)) return [];
  return item.labels
    .map((label) => (typeof label === "string" ? label : label?.name))
    .filter((label) => typeof label === "string" && label.trim() !== "")
    .map((label) => label.trim());
}

function priorityFromText(value) {
  const match = String(value || "").match(/\bP([0-3])\b/i);
  return match ? `P${match[1]}` : null;
}

export function priorityFor(item) {
  for (const label of labelNames(item)) {
    const priority = priorityFromText(label);
    if (priority) return { priority, prioritySource: "label" };
  }
  const titlePriority = priorityFromText(item?.title);
  if (titlePriority) return { priority: titlePriority, prioritySource: "title" };
  return { priority: "P3", prioritySource: "default" };
}

export function commentBucket(comments) {
  const count = integerField(comments, "comments");
  if (count === 0) return "none";
  if (count <= 3) return "light";
  if (count <= 9) return "active";
  return "hot";
}

export function updatedBucket(updatedAt, generatedAt) {
  const updated = Date.parse(normalizeTimestamp(updatedAt, "updatedAt"));
  const generated = Date.parse(normalizeTimestamp(generatedAt, "generatedAt"));
  const age = Math.max(0, generated - updated);
  const day = 24 * 60 * 60 * 1000;
  if (age <= day) return "24h";
  if (age <= 7 * day) return "7d";
  if (age <= 30 * day) return "30d";
  return "older";
}

function packageAliasEntries(catalog) {
  return [...catalog.entries()].sort(([left], [right]) => right.length - left.length);
}

function stripPackagePath(value) {
  return String(value).replace(/^packages\//i, "").trim();
}

function stripPriorityTitlePrefix(value) {
  return value.replace(
    /^(?:\[\s*P[0-3]\s*\]|\(\s*P[0-3]\s*\)|P[0-3])\s*(?::|\||-|–|—)?\s*/i,
    "",
  );
}

function knownPrefix(value, catalog) {
  const lower = value.toLowerCase();
  for (const [alias, entry] of packageAliasEntries(catalog)) {
    if (!lower.startsWith(alias)) continue;
    const boundary = lower.slice(alias.length);
    if (boundary === "" || /^[\s:|/\-–—]/.test(boundary)) {
      return {
        package: entry.name,
        packageDirectory: entry.directory,
        titlePrefix: value.slice(0, alias.length),
      };
    }
  }
  return null;
}

export function matchTitlePrefix(title, catalog = new Map()) {
  const source = titleText(title).trim();
  const withoutPriority = stripPriorityTitlePrefix(source).trim();
  if (withoutPriority === "") {
    return { package: null, packageDirectory: null, titlePrefix: null };
  }

  const bracketed = withoutPriority.match(/^[\[({]\s*([^\]\)}]+?)\s*[\]\)}](?=\s|$|[:|/–—-])/);
  let candidate = bracketed?.[1]?.trim() || null;

  if (!candidate) {
    const known = knownPrefix(withoutPriority, catalog);
    if (known) return known;
    const separated = withoutPriority.match(/^(.{1,160}?)(?=\s*(?::|\||-|–|—)\s+|\s*\/\s*)/);
    if (separated) candidate = separated[1].trim();
  }

  if (!candidate) return { package: null, packageDirectory: null, titlePrefix: null };

  const normalized = stripPackagePath(candidate);
  const entry = catalog.get(candidate.toLowerCase()) || catalog.get(normalized.toLowerCase());
  if (entry) {
    return {
      package: entry.name,
      packageDirectory: entry.directory,
      titlePrefix: candidate,
    };
  }
  return {
    package: null,
    packageDirectory: null,
    titlePrefix: candidate,
  };
}

export async function loadPackageCatalog(root = process.cwd()) {
  const packagesDirectory = path.join(root, "packages");
  let entries;
  try {
    entries = await readdir(packagesDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return new Map();
    throw error;
  }

  const catalog = new Map();
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const packagePath = path.join(packagesDirectory, entry.name, "package.json");
    let packageJson;
    try {
      packageJson = JSON.parse(await readFile(packagePath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      console.warn(`panel-sync: skipping ${packagePath}: ${error.message}`);
      continue;
    }
    if (!packageJson || typeof packageJson.name !== "string" || packageJson.name.trim() === "") {
      continue;
    }
    const packageEntry = { name: packageJson.name.trim(), directory: entry.name };
    const aliases = [
      packageEntry.name,
      entry.name,
      packageEntry.name.includes("/") ? packageEntry.name.split("/").slice(1).join("/") : packageEntry.name,
    ];
    for (const alias of aliases) {
      const key = alias.trim().toLowerCase();
      if (key && !catalog.has(key)) catalog.set(key, packageEntry);
    }
  }
  return catalog;
}

function issueUrl(repository, number) {
  return `${repository.webBase}/${repository.full}/issues/${number}`;
}

function pullUrl(repository, number) {
  return `${repository.webBase}/${repository.full}/pull/${number}`;
}

function normalizedLabels(item) {
  return labelNames(item);
}

function normalizeIssue(item, repository, generatedAt, catalog) {
  const number = integerField(item?.number, "issue.number", { minimum: 1 });
  const title = titleText(item?.title);
  const comments = integerField(item?.comments ?? 0, "issue.comments");
  const updatedAt = normalizeTimestamp(item?.updated_at, "issue.updated_at");
  const createdAt = normalizeTimestamp(item?.created_at, "issue.created_at");
  const packageInfo = matchTitlePrefix(title, catalog);
  const priorityInfo = priorityFor(item);

  return {
    number,
    title,
    url: issueUrl(repository, number),
    package: packageInfo.package,
    packageDirectory: packageInfo.packageDirectory,
    titlePrefix: packageInfo.titlePrefix,
    priority: priorityInfo.priority,
    prioritySource: priorityInfo.prioritySource,
    comments,
    commentBucket: commentBucket(comments),
    updatedAt,
    updatedBucket: updatedBucket(updatedAt, generatedAt),
    createdAt,
    labels: normalizedLabels(item),
    author: typeof item?.user?.login === "string" ? item.user.login : null,
  };
}

function normalizePull(item, repository, generatedAt, catalog, comments) {
  const number = integerField(item?.number, "pull.number", { minimum: 1 });
  const title = titleText(item?.title);
  const commentCount = integerField(comments ?? item?.comments ?? 0, "pull.comments");
  const updatedAt = normalizeTimestamp(item?.updated_at, "pull.updated_at");
  const createdAt = normalizeTimestamp(item?.created_at, "pull.created_at");
  const packageInfo = matchTitlePrefix(title, catalog);
  const priorityInfo = priorityFor(item);

  return {
    number,
    title,
    url: pullUrl(repository, number),
    draft: item?.draft === true,
    package: packageInfo.package,
    packageDirectory: packageInfo.packageDirectory,
    titlePrefix: packageInfo.titlePrefix,
    priority: priorityInfo.priority,
    prioritySource: priorityInfo.prioritySource,
    comments: commentCount,
    commentBucket: commentBucket(commentCount),
    updatedAt,
    updatedBucket: updatedBucket(updatedAt, generatedAt),
    createdAt,
    labels: normalizedLabels(item),
    author: typeof item?.user?.login === "string" ? item.user.login : null,
  };
}

function priorityRank(priority) {
  const rank = PRIORITY_RANK.get(priority);
  if (rank === undefined) throw new Error(`unknown priority ${JSON.stringify(priority)}`);
  return rank;
}

export function compareIssues(left, right) {
  return (
    priorityRank(left.priority) - priorityRank(right.priority) ||
    Date.parse(right.updatedAt) - Date.parse(left.updatedAt) ||
    right.comments - left.comments ||
    right.number - left.number
  );
}

export function comparePulls(left, right) {
  return (
    Number(right.draft) - Number(left.draft) ||
    priorityRank(left.priority) - priorityRank(right.priority) ||
    right.comments - left.comments ||
    Date.parse(right.updatedAt) - Date.parse(left.updatedAt) ||
    right.number - left.number
  );
}

function assertUniqueNumbers(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.number)) throw new Error(`duplicate ${label} number ${item.number}`);
    seen.add(item.number);
  }
  return seen;
}

function countBuckets(items, buckets, field) {
  const counts = Object.fromEntries(buckets.map((bucket) => [bucket, 0]));
  for (const item of items) counts[item[field]] += 1;
  return counts;
}

export function summarizePanel(issues, pulls) {
  const draft = pulls.filter((pull) => pull.draft).length;
  return {
    issueCount: issues.length,
    pullCount: pulls.length,
    draftPullCount: draft,
    readyPullCount: pulls.length - draft,
    byPriority: {
      issues: countBuckets(issues, PRIORITIES, "priority"),
      pulls: countBuckets(pulls, PRIORITIES, "priority"),
    },
    byComments: {
      issues: countBuckets(issues, COMMENT_BUCKETS, "commentBucket"),
      pulls: countBuckets(pulls, COMMENT_BUCKETS, "commentBucket"),
    },
    byUpdated: {
      issues: countBuckets(issues, UPDATED_BUCKETS, "updatedBucket"),
      pulls: countBuckets(pulls, UPDATED_BUCKETS, "updatedBucket"),
    },
    byDraft: {
      draft,
      ready: pulls.length - draft,
    },
  };
}

export function buildPanel({
  repository = makeRepository(DEFAULT_REPOSITORY),
  issueItems = [],
  pullItems = [],
  generatedAt = new Date().toISOString(),
  catalog = new Map(),
} = {}) {
  if (!Array.isArray(issueItems) || !Array.isArray(pullItems)) {
    throw new Error("issueItems and pullItems must be arrays");
  }
  const repo = typeof repository === "string" ? makeRepository(repository) : repository;
  const timestamp = normalizeTimestamp(generatedAt, "generatedAt");
  const pullComments = new Map();
  for (const item of issueItems) {
    if (item?.pull_request) {
      const number = integerField(item.number, "issue.pull_request.number", { minimum: 1 });
      pullComments.set(number, integerField(item.comments ?? 0, "issue.pull_request.comments"));
    }
  }

  const issues = issueItems
    .filter((item) => !item?.pull_request)
    .map((item) => normalizeIssue(item, repo, timestamp, catalog))
    .sort(compareIssues);
  const pulls = pullItems
    .map((item) =>
      normalizePull(item, repo, timestamp, catalog, pullComments.get(item?.number) ?? item?.comments ?? 0),
    )
    .sort(comparePulls);
  const issueNumbers = assertUniqueNumbers(issues, "issue");
  const pullNumbers = assertUniqueNumbers(pulls, "pull request");
  for (const number of issueNumbers) {
    if (pullNumbers.has(number)) throw new Error(`issue and pull request number ${number} overlap`);
  }

  return {
    schemaVersion: 1,
    generatedAt: timestamp,
    source: {
      repository: repo.full,
      issuesUrl: `${repo.apiBase}/repos/${repo.full}/issues`,
      pullsUrl: `${repo.apiBase}/repos/${repo.full}/pulls`,
    },
    summary: summarizePanel(issues, pulls),
    issues,
    pulls,
  };
}

function escapeMarkdown(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function escapeLinkLabel(value) {
  return escapeMarkdown(value).replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}

function markdownLink(label, url) {
  return `[${escapeLinkLabel(label)}](${url})`;
}

function packageCell(item) {
  if (item.package) return `\`${escapeMarkdown(item.package).replace(/`/g, "\\`")}\``;
  if (item.titlePrefix) return `_unmapped_ (\`${escapeMarkdown(item.titlePrefix).replace(/`/g, "\\`")}\`)`;
  return "_unmapped_";
}

export function packageGroupKey(item) {
  if (item.package) return item.package;
  if (item.titlePrefix) return `unmapped:${item.titlePrefix}`;
  return "unmapped";
}

export function comparePackageKeys(left, right) {
  const leftUnmapped = left.startsWith("unmapped:");
  const rightUnmapped = right.startsWith("unmapped:");
  if (leftUnmapped !== rightUnmapped) return leftUnmapped ? 1 : -1;
  return left < right ? -1 : left > right ? 1 : 0;
}

function groupedItems(items) {
  const groups = new Map();
  for (const item of items) {
    const key = packageGroupKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()].sort(([left], [right]) => comparePackageKeys(left, right));
}

function packageHeading(key) {
  return `### Package: \`${escapeMarkdown(key).replace(/`/g, "\\`")}\``;
}

function issueRow(item) {
  return `| ${item.priority} | ${item.comments} (${item.commentBucket}) | ${item.updatedAt} | ${item.updatedBucket} | ${packageCell(item)} | ${markdownLink(`#${item.number} ${item.title}`, item.url)} |`;
}

function pullRow(item) {
  const draft = item.draft ? "draft" : "ready";
  return `| ${item.priority} | ${draft} | ${item.comments} (${item.commentBucket}) | ${item.updatedAt} | ${item.updatedBucket} | ${packageCell(item)} | ${markdownLink(`#${item.number} ${item.title}`, item.url)} |`;
}

function countsSentence(counts) {
  return Object.entries(counts)
    .map(([name, count]) => `${name} **${count}**`)
    .join(", ");
}

export function renderIssuesMarkdown(status) {
  const source = status.source;
  const lines = [
    "# Upstream open issues",
    "",
    `Generated at \`${status.generatedAt}\` from [${source.repository}](https://github.com/${source.repository}/issues).`,
    "",
    "## Summary",
    "",
    `- Open issues: **${status.summary.issueCount}**`,
    `- Priority: ${countsSentence(status.summary.byPriority.issues)}`,
    `- Comments: ${countsSentence(status.summary.byComments.issues)}`,
    `- Updated: ${countsSentence(status.summary.byUpdated.issues)}`,
    "",
    "Issues are ordered by priority, then updated time, comments, and number.",
  ];

  for (const priority of PRIORITIES) {
    const items = status.issues.filter((item) => item.priority === priority);
    lines.push("", `## ${priority}`, "");
    if (items.length === 0) {
      lines.push("_No open issues._");
      continue;
    }
    for (const [key, group] of groupedItems(items)) {
      lines.push(
        packageHeading(key),
        "",
        "| Priority | Comments | Updated | Updated bucket | Package | Issue |",
        "| --- | ---: | --- | --- | --- | --- |",
        ...group.map(issueRow),
        "",
      );
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderPullsMarkdown(status) {
  const source = status.source;
  const lines = [
    "# Upstream open pull requests",
    "",
    `Generated at \`${status.generatedAt}\` from [${source.repository}](https://github.com/${source.repository}/pulls).`,
    "",
    "## Summary",
    "",
    `- Open pull requests: **${status.summary.pullCount}**`,
    `- Draft: **${status.summary.draftPullCount}**, ready: **${status.summary.readyPullCount}**`,
    `- Priority: ${countsSentence(status.summary.byPriority.pulls)}`,
    `- Comments: ${countsSentence(status.summary.byComments.pulls)}`,
    `- Updated: ${countsSentence(status.summary.byUpdated.pulls)}`,
    "",
    "Pull requests are ordered by draft state, priority, comments, updated time, and number.",
  ];

  for (const [heading, draft] of [
    ["Draft", true],
    ["Ready for review", false],
  ]) {
    const items = status.pulls.filter((item) => item.draft === draft);
    lines.push("", `## ${heading}`, "");
    if (items.length === 0) {
      lines.push("_No open pull requests._");
      continue;
    }
    for (const [key, group] of groupedItems(items)) {
      lines.push(
        packageHeading(key),
        "",
        "| Priority | Draft | Comments | Updated | Updated bucket | Package | Pull request |",
        "| --- | --- | ---: | --- | --- | --- | --- |",
        ...group.map(pullRow),
        "",
      );
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export async function writePanelFiles(panel, outputDirectory = DEFAULT_PANEL_DIR) {
  const directory = path.resolve(outputDirectory);
  await mkdir(directory, { recursive: true });
  const files = {
    status: path.join(directory, "status.json"),
    issues: path.join(directory, "issues.md"),
    pulls: path.join(directory, "pulls.md"),
  };
  const suffix = `.${process.pid}.${Date.now()}.tmp`;
  const temporary = {
    status: `${files.status}${suffix}`,
    issues: `${files.issues}${suffix}`,
    pulls: `${files.pulls}${suffix}`,
  };
  try {
    await Promise.all([
      writeFile(temporary.status, `${JSON.stringify(panel, null, 2)}\n`, "utf8"),
      writeFile(temporary.issues, renderIssuesMarkdown(panel), "utf8"),
      writeFile(temporary.pulls, renderPullsMarkdown(panel), "utf8"),
    ]);
    await rename(temporary.status, files.status);
    await rename(temporary.issues, files.issues);
    await rename(temporary.pulls, files.pulls);
  } catch (error) {
    await Promise.all(Object.values(temporary).map((file) => rm(file, { force: true })));
    throw error;
  }
  return files;
}

function githubHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "magpie-panel-sync/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function nextLink(linkHeader) {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="([^"]+)"/);
    if (match && match[2].split(/\s+/).includes("next")) return match[1];
  }
  return null;
}

function endpointUrl(repository, endpoint, page, perPage) {
  const url = new URL(`${repository.apiBase}/repos/${repository.full}/${endpoint}`);
  url.searchParams.set("state", "open");
  url.searchParams.set("sort", "updated");
  url.searchParams.set("direction", "desc");
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  return url;
}

async function fetchPage(url, fetchImpl, token, timeoutMs) {
  const response = await fetchImpl(url, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 500).replace(/\s+/g, " ");
    } catch {
      detail = "";
    }
    throw new Error(`GitHub REST ${response.status} ${response.statusText} for ${url}: ${detail}`);
  }
  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(`GitHub REST returned invalid JSON for ${url}: ${error.message}`);
  }
  if (!Array.isArray(data)) {
    throw new Error(`GitHub REST returned a non-array response for ${url}`);
  }
  return { data, link: response.headers?.get?.("link") || "" };
}

export async function fetchPaginated(
  repository,
  endpoint,
  {
    token = envValue("GITHUB_TOKEN", envValue("GH_TOKEN", "")),
    fetchImpl = globalThis.fetch,
    perPage = positiveInteger(envValue("GITHUB_PER_PAGE", ""), DEFAULT_PER_PAGE, "GITHUB_PER_PAGE"),
    maxPages = positiveInteger(envValue("GITHUB_MAX_PAGES", ""), DEFAULT_MAX_PAGES, "GITHUB_MAX_PAGES"),
    timeoutMs = positiveInteger(envValue("GITHUB_TIMEOUT_MS", ""), 30000, "GITHUB_TIMEOUT_MS"),
  } = {},
) {
  if (typeof fetchImpl !== "function") throw new Error("Node fetch is not available");
  const repo = typeof repository === "string" ? makeRepository(repository) : repository;
  const pageSize = positiveInteger(perPage, DEFAULT_PER_PAGE, "perPage");
  const pageLimit = positiveInteger(maxPages, DEFAULT_MAX_PAGES, "maxPages");
  const rows = [];
  let page = 1;
  let url = endpointUrl(repo, endpoint, page, pageSize);
  const visited = new Set();

  while (url) {
    const key = url.toString();
    if (visited.has(key)) throw new Error(`pagination loop detected at ${key}`);
    visited.add(key);
    const { data, link } = await fetchPage(url, fetchImpl, token, timeoutMs);
    rows.push(...data);

    const linkNext = nextLink(link);
    if (linkNext) {
      if (page >= pageLimit) {
        throw new Error(`GitHub pagination exceeded GITHUB_MAX_PAGES=${pageLimit}`);
      }
      url = new URL(linkNext, url);
      page += 1;
    } else if (data.length === pageSize) {
      if (page >= pageLimit) {
        throw new Error(`GitHub pagination exceeded GITHUB_MAX_PAGES=${pageLimit}`);
      }
      page += 1;
      url = endpointUrl(repo, endpoint, page, pageSize);
    } else {
      url = null;
    }
  }
  return rows;
}

export async function fetchUpstream({
  repository = makeRepository(envValue("UPSTREAM_REPO", DEFAULT_REPOSITORY)),
  token,
  fetchImpl = globalThis.fetch,
  perPage,
  maxPages,
  timeoutMs,
} = {}) {
  const repo = typeof repository === "string" ? makeRepository(repository) : repository;
  const [issueItems, pullItems] = await Promise.all([
    fetchPaginated(repo, "issues", { token, fetchImpl, perPage, maxPages, timeoutMs }),
    fetchPaginated(repo, "pulls", { token, fetchImpl, perPage, maxPages, timeoutMs }),
  ]);
  return { issueItems, pullItems };
}

export async function syncPanel({
  repository = makeRepository(envValue("UPSTREAM_REPO", DEFAULT_REPOSITORY)),
  outputDirectory = envValue("PANEL_DIR", DEFAULT_PANEL_DIR),
  generatedAt = envValue("PANEL_NOW", new Date().toISOString()),
  token,
  fetchImpl = globalThis.fetch,
  root = process.cwd(),
  timeoutMs,
} = {}) {
  const repo = typeof repository === "string" ? makeRepository(repository) : repository;
  const catalog = await loadPackageCatalog(root);
  const upstream = await fetchUpstream({ repository: repo, token, fetchImpl, timeoutMs });
  const panel = buildPanel({
    repository: repo,
    issueItems: upstream.issueItems,
    pullItems: upstream.pullItems,
    generatedAt,
    catalog,
  });
  await writePanelFiles(panel, outputDirectory);
  return panel;
}

function fixtureCatalog() {
  const catalog = new Map();
  for (const entry of [
    {
      name: "@magpie-community/opencode-qoder-auth",
      directory: "qoder",
    },
    {
      name: "@magpie-community/agent-wave",
      directory: "wave",
    },
  ]) {
    for (const alias of [
      entry.name,
      entry.directory,
      entry.name.split("/").slice(1).join("/"),
    ]) {
      catalog.set(alias.toLowerCase(), entry);
    }
  }
  return catalog;
}

export function createFixturePanel(generatedAt = "2026-11-25T12:00:00.000Z") {
  const repository = makeRepository(DEFAULT_REPOSITORY);
  const common = {
    created_at: "2026-09-01T08:00:00Z",
    labels: [],
    user: { login: "maintainer" },
  };
  const issueItems = [
    {
      ...common,
      number: 101,
      title: "[P1] opencode-qoder-auth: refresh token fails",
      comments: 7,
      updated_at: "2026-11-25T10:00:00Z",
      labels: [{ name: "P1" }],
    },
    {
      ...common,
      number: 102,
      title: "[P0] qoder: login loop",
      comments: 12,
      updated_at: "2026-11-25T09:00:00Z",
      labels: [{ name: "priority/P0" }],
    },
    {
      ...common,
      number: 103,
      title: "agent-wave: stale quota",
      comments: 2,
      updated_at: "2026-11-18T09:00:00Z",
      labels: [{ name: "P2" }],
    },
    {
      ...common,
      number: 104,
      title: "General: update docs",
      comments: 0,
      updated_at: "2026-10-01T09:00:00Z",
    },
    {
      ...common,
      number: 201,
      title: "opencode-qoder-auth: fix login",
      comments: 4,
      updated_at: "2026-11-25T08:00:00Z",
      pull_request: { url: "https://api.github.com/repos/magpie-community/plugins/pulls/201" },
    },
  ];
  const pullItems = [
    {
      ...common,
      number: 201,
      title: "opencode-qoder-auth: fix login",
      draft: true,
      updated_at: "2026-11-25T08:00:00Z",
      labels: [{ name: "P1" }],
    },
    {
      ...common,
      number: 202,
      title: "qoder: recover expired session",
      draft: false,
      updated_at: "2026-11-25T07:00:00Z",
      labels: [{ name: "P0" }],
    },
    {
      ...common,
      number: 203,
      title: "agent-wave: explain quota reset",
      draft: true,
      updated_at: "2026-11-19T07:00:00Z",
    },
  ];
  return buildPanel({
    repository,
    issueItems,
    pullItems,
    generatedAt,
    catalog: fixtureCatalog(),
  });
}

function parseArguments(argv) {
  const result = {
    fixture: false,
    outputDirectory: envValue("PANEL_DIR", DEFAULT_PANEL_DIR),
    repository: envValue("UPSTREAM_REPO", DEFAULT_REPOSITORY),
    generatedAt: envValue("PANEL_NOW", ""),
    issuesFile: "",
    pullsFile: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--fixture") {
      result.fixture = true;
    } else if (argument === "--out") {
      result.outputDirectory = argv[++index] || "";
    } else if (argument.startsWith("--out=")) {
      result.outputDirectory = argument.slice("--out=".length);
    } else if (argument === "--repo") {
      result.repository = argv[++index] || "";
    } else if (argument.startsWith("--repo=")) {
      result.repository = argument.slice("--repo=".length);
    } else if (argument === "--now") {
      result.generatedAt = argv[++index] || "";
    } else if (argument.startsWith("--now=")) {
      result.generatedAt = argument.slice("--now=".length);
    } else if (argument === "--issues") {
      result.issuesFile = argv[++index] || "";
    } else if (argument.startsWith("--issues=")) {
      result.issuesFile = argument.slice("--issues=".length);
    } else if (argument === "--pulls") {
      result.pullsFile = argv[++index] || "";
    } else if (argument.startsWith("--pulls=")) {
      result.pullsFile = argument.slice("--pulls=".length);
    } else if (argument === "--help" || argument === "-h") {
      result.help = true;
    } else {
      throw new Error(`unknown argument ${JSON.stringify(argument)}`);
    }
  }
  if (!result.outputDirectory) throw new Error("--out must not be empty");
  if (Boolean(result.issuesFile) !== Boolean(result.pullsFile)) {
    throw new Error("--issues and --pulls must be supplied together");
  }
  return result;
}

function isMainModule() {
  const entry = process.argv[1];
  return Boolean(entry) && path.resolve(entry) === fileURLToPath(import.meta.url);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(
      "usage: node scripts/panel-sync.mjs [--fixture | --issues FILE --pulls FILE] [--out DIR] [--repo OWNER/NAME] [--now ISO]",
    );
    return;
  }
  const repository = makeRepository(options.repository);
  let panel;
  if (options.fixture) {
    panel = createFixturePanel(options.generatedAt || undefined);
  } else if (options.issuesFile) {
    const [issueSource, pullSource] = await Promise.all([
      readFile(options.issuesFile, "utf8"),
      readFile(options.pullsFile, "utf8"),
    ]);
    const issueItems = JSON.parse(issueSource);
    const pullItems = JSON.parse(pullSource);
    if (!Array.isArray(issueItems) || !Array.isArray(pullItems)) {
      throw new Error("--issues and --pulls files must each contain a JSON array");
    }
    panel = buildPanel({
      repository,
      issueItems,
      pullItems,
      generatedAt: options.generatedAt || undefined,
      catalog: await loadPackageCatalog(process.cwd()),
    });
  } else {
    panel = await syncPanel({
      repository,
      outputDirectory: options.outputDirectory,
      generatedAt: options.generatedAt || undefined,
    });
  }
  if (options.fixture) await writePanelFiles(panel, options.outputDirectory);
  if (options.issuesFile) await writePanelFiles(panel, options.outputDirectory);
  console.log(
    `panel-sync: wrote ${options.outputDirectory}/status.json, ${options.outputDirectory}/issues.md, ${options.outputDirectory}/pulls.md (${panel.summary.issueCount} issues, ${panel.summary.pullCount} pull requests)`,
  );
}

if (isMainModule()) {
  main().catch((error) => {
    console.error(`panel-sync: ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}
