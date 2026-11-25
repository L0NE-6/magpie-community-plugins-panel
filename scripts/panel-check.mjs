#!/usr/bin/env node

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import {
  COMMENT_BUCKETS,
  PRIORITIES,
  UPDATED_BUCKETS,
  commentBucket,
  comparePackageKeys,
  compareIssues,
  comparePulls,
  createFixturePanel,
  packageGroupKey,
  summarizePanel,
  updatedBucket,
  writePanelFiles,
} from "./panel-sync.mjs";

const DEFAULT_PANEL_DIR = "panel";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTimestamp(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function repositoryParts(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  return match ? { owner: match[1], name: match[2], full: `${match[1]}/${match[2]}` } : null;
}

function add(errors, condition, message) {
  if (!condition) errors.push(message);
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function checkBucketMap(errors, value, buckets, at) {
  add(errors, isObject(value), `${at} must be an object`);
  if (!isObject(value)) return;
  add(
    errors,
    sameValue(Object.keys(value).sort(), [...buckets].sort()),
    `${at} must contain exactly ${buckets.join(", ")}`,
  );
  for (const bucket of buckets) {
    add(
      errors,
      Number.isSafeInteger(value[bucket]) && value[bucket] >= 0,
      `${at}.${bucket} must be a non-negative integer`,
    );
  }
}

function checkUrl(errors, value, at, expected) {
  add(errors, typeof value === "string" && value !== "", `${at} must be a non-empty URL`);
  if (typeof value !== "string" || value === "") return;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    errors.push(`${at} is not a valid URL: ${value}`);
    return;
  }
  add(errors, parsed.protocol === "https:", `${at} must use https`);
  if (expected) add(errors, parsed.href === expected, `${at} must be ${expected}, got ${value}`);
}

function checkItem(errors, item, index, status, repository, kind) {
  const at = `${kind}[${index}]`;
  add(errors, isObject(item), `${at} must be an object`);
  if (!isObject(item)) return null;

  const number = item.number;
  add(errors, Number.isSafeInteger(number) && number > 0, `${at}.number must be a positive integer`);
  add(errors, typeof item.title === "string" && item.title.trim() !== "", `${at}.title must be non-empty`);
  add(errors, typeof item.package === "string" || item.package === null, `${at}.package must be text or null`);
  add(
    errors,
    typeof item.packageDirectory === "string" || item.packageDirectory === null,
    `${at}.packageDirectory must be text or null`,
  );
  add(
    errors,
    (item.package === null) === (item.packageDirectory === null),
    `${at}.package and packageDirectory must both be set or both be null`,
  );
  add(
    errors,
    typeof item.titlePrefix === "string" || item.titlePrefix === null,
    `${at}.titlePrefix must be text or null`,
  );
  add(errors, PRIORITIES.includes(item.priority), `${at}.priority must be one of ${PRIORITIES.join(", ")}`);
  add(
    errors,
    ["label", "title", "default"].includes(item.prioritySource),
    `${at}.prioritySource must be label, title, or default`,
  );
  add(
    errors,
    Number.isSafeInteger(item.comments) && item.comments >= 0,
    `${at}.comments must be a non-negative integer`,
  );
  add(
    errors,
    COMMENT_BUCKETS.includes(item.commentBucket),
    `${at}.commentBucket must be one of ${COMMENT_BUCKETS.join(", ")}`,
  );
  add(errors, isTimestamp(item.updatedAt), `${at}.updatedAt must be a canonical ISO timestamp`);
  add(errors, isTimestamp(item.createdAt), `${at}.createdAt must be a canonical ISO timestamp`);
  add(
    errors,
    UPDATED_BUCKETS.includes(item.updatedBucket),
    `${at}.updatedBucket must be one of ${UPDATED_BUCKETS.join(", ")}`,
  );
  add(errors, Array.isArray(item.labels) && item.labels.every((label) => typeof label === "string"), `${at}.labels must be a string array`);
  add(errors, item.author === null || typeof item.author === "string", `${at}.author must be text or null`);

  if (kind === "pulls") {
    add(errors, typeof item.draft === "boolean", `${at}.draft must be boolean`);
  }

  if (Number.isSafeInteger(number) && number > 0) {
    const expectedUrl = `https://github.com/${repository}/${kind === "issues" ? "issues" : "pull"}/${number}`;
    checkUrl(errors, item.url, `${at}.url`, expectedUrl);
  } else {
    checkUrl(errors, item.url, `${at}.url`);
  }

  if (isTimestamp(item.updatedAt) && isTimestamp(status.generatedAt)) {
    const updated = Date.parse(item.updatedAt);
    const generated = Date.parse(status.generatedAt);
    add(errors, updated <= generated + 5 * 60 * 1000, `${at}.updatedAt is in the future`);
    if (Number.isSafeInteger(item.comments) && item.comments >= 0) {
      add(
        errors,
        item.commentBucket === commentBucket(item.comments),
        `${at}.commentBucket does not match comments`,
      );
    }
    add(
      errors,
      item.updatedBucket === updatedBucket(item.updatedAt, status.generatedAt),
      `${at}.updatedBucket does not match updatedAt`,
    );
  }
  if (isTimestamp(item.createdAt) && isTimestamp(item.updatedAt)) {
    add(
      errors,
      Date.parse(item.createdAt) <= Date.parse(item.updatedAt) + 5 * 60 * 1000,
      `${at}.createdAt is after updatedAt`,
    );
  }
  return number;
}

function checkSorted(errors, items, comparator, at) {
  for (let index = 1; index < items.length; index += 1) {
    let ordered;
    try {
      ordered = comparator(items[index - 1], items[index]) <= 0;
    } catch (error) {
      errors.push(`${at} cannot be sorted at index ${index}: ${error.message}`);
      return;
    }
    add(errors, ordered, `${at} is not sorted at index ${index}`);
  }
}

function validateStatus(status, errors) {
  add(errors, isObject(status), "status.json must contain an object");
  if (!isObject(status)) return null;
  add(errors, status.schemaVersion === 1, "schemaVersion must be 1");
  add(errors, isTimestamp(status.generatedAt), "generatedAt must be a canonical ISO timestamp");
  add(errors, isObject(status.source), "source must be an object");
  add(errors, Array.isArray(status.issues), "issues must be an array");
  add(errors, Array.isArray(status.pulls), "pulls must be an array");
  add(errors, isObject(status.summary), "summary must be an object");
  if (!isObject(status.source)) return null;

  const repository = repositoryParts(status.source.repository);
  add(errors, repository !== null, "source.repository must be owner/name");
  if (repository) {
    let expectedApiOrigin;
    try {
      expectedApiOrigin = new URL(process.env.GITHUB_API_URL?.trim() || "https://api.github.com").origin;
    } catch {
      errors.push("GITHUB_API_URL must be a valid URL");
    }
    let issuesUrl;
    let pullsUrl;
    try {
      issuesUrl = new URL(status.source.issuesUrl);
      pullsUrl = new URL(status.source.pullsUrl);
    } catch {
      errors.push("source issue and pull URLs must be valid URLs");
    }
    if (issuesUrl) {
      add(errors, issuesUrl.protocol === "https:", "source.issuesUrl must use https");
      if (expectedApiOrigin) {
        add(errors, issuesUrl.origin === expectedApiOrigin, "source.issuesUrl must use the configured API origin");
      }
      add(
        errors,
        issuesUrl.pathname.endsWith(`/repos/${repository.full}/issues`),
        "source.issuesUrl must point at the repository issues endpoint",
      );
    }
    if (pullsUrl) {
      add(errors, pullsUrl.protocol === "https:", "source.pullsUrl must use https");
      if (expectedApiOrigin) {
        add(errors, pullsUrl.origin === expectedApiOrigin, "source.pullsUrl must use the configured API origin");
      }
      add(
        errors,
        pullsUrl.pathname.endsWith(`/repos/${repository.full}/pulls`),
        "source.pullsUrl must point at the repository pulls endpoint",
      );
    }
  }

  const issueNumbers = new Set();
  const pullNumbers = new Set();
  if (Array.isArray(status.issues)) {
    status.issues.forEach((item, index) => {
      const number = checkItem(errors, item, index, status, repository?.full || "", "issues");
      if (number !== null) {
        add(errors, !issueNumbers.has(number), `duplicate issue number ${number}`);
        issueNumbers.add(number);
      }
      add(errors, !item?.pull_request, `issues[${index}] must not be a pull request`);
    });
    checkSorted(errors, status.issues, compareIssues, "issues");
  }
  if (Array.isArray(status.pulls)) {
    status.pulls.forEach((item, index) => {
      const number = checkItem(errors, item, index, status, repository?.full || "", "pulls");
      if (number !== null) {
        add(errors, !pullNumbers.has(number), `duplicate pull number ${number}`);
        pullNumbers.add(number);
      }
    });
    checkSorted(errors, status.pulls, comparePulls, "pulls");
  }
  for (const number of issueNumbers) {
    add(errors, !pullNumbers.has(number), `issue and pull request number ${number} overlap`);
  }

  if (Array.isArray(status.issues) && Array.isArray(status.pulls)) {
    const expected = summarizePanel(status.issues, status.pulls);
    add(errors, isObject(status.summary), "summary must be an object");
    if (isObject(status.summary)) {
      add(errors, isDeepStrictEqual(status.summary, expected), "summary does not match the item arrays");
      checkBucketMap(errors, status.summary.byPriority?.issues, PRIORITIES, "summary.byPriority.issues");
      checkBucketMap(errors, status.summary.byPriority?.pulls, PRIORITIES, "summary.byPriority.pulls");
      checkBucketMap(errors, status.summary.byComments?.issues, COMMENT_BUCKETS, "summary.byComments.issues");
      checkBucketMap(errors, status.summary.byComments?.pulls, COMMENT_BUCKETS, "summary.byComments.pulls");
      checkBucketMap(errors, status.summary.byUpdated?.issues, UPDATED_BUCKETS, "summary.byUpdated.issues");
      checkBucketMap(errors, status.summary.byUpdated?.pulls, UPDATED_BUCKETS, "summary.byUpdated.pulls");
    }
  }
  return repository;
}

function extractLinks(markdown) {
  const links = [];
  const pattern = /\[((?:\\.|[^\]])*)\]\(([^)\s]+)\)/g;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    links.push({
      label: match[1].replace(/\\([\[\]])/g, "$1"),
      url: match[2],
      index: match.index,
    });
  }
  return links;
}

function checkMarkdownLinks(markdown, at, errors) {
  for (const link of extractLinks(markdown)) {
    add(errors, link.label.trim() !== "", `${at} contains an empty link label`);
    let parsed;
    try {
      parsed = new URL(link.url);
    } catch {
      errors.push(`${at} contains a non-absolute link: ${link.url}`);
      continue;
    }
    add(errors, parsed.protocol === "https:", `${at} contains a non-https link: ${link.url}`);
  }
}

function linkNumber(link, repository, kind) {
  const escaped = repository.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^https://github\\.com/${escaped}/${kind}/(\\d+)$`);
  const match = link.match(pattern);
  return match ? Number(match[1]) : null;
}

function parseClassifiedMarkdown(markdown, repository, kind, errors) {
  const sections = [];
  const entries = [];
  let section = null;
  let packageKey = null;

  for (const line of markdown.split(/\r?\n/)) {
    const sectionMatch = line.match(/^## (P[0-3]|Draft|Ready for review)$/);
    if (sectionMatch) {
      section = { name: sectionMatch[1], packageKeys: [] };
      sections.push(section);
      packageKey = null;
      continue;
    }
    const packageMatch = line.match(/^### Package: `([^`]+)`$/);
    if (packageMatch) {
      packageKey = packageMatch[1];
      if (!section) {
        errors.push(`${kind}.md has a package group outside a classification section`);
      } else {
        section.packageKeys.push(packageKey);
      }
      continue;
    }
    for (const link of extractLinks(line)) {
      const number = linkNumber(link.url, repository, kind === "issues" ? "issues" : "pull");
      if (number === null) continue;
      if (!section || !packageKey) {
        errors.push(`${kind}.md has item #${number} outside a package group`);
        continue;
      }
      entries.push({
        ...link,
        number,
        section: section.name,
        packageKey,
      });
    }
  }
  return { sections, entries };
}

function expectedMarkdownContexts(items, kind) {
  const contexts = new Map();
  for (const item of items) {
    const section = kind === "issues" ? item.priority : item.draft ? "Draft" : "Ready for review";
    const key = `${section}\u0000${packageGroupKey(item)}`;
    if (!contexts.has(key)) contexts.set(key, []);
    contexts.get(key).push(item);
  }
  return contexts;
}

function actualMarkdownContexts(entries, kind) {
  const contexts = new Map();
  for (const entry of entries) {
    const key = `${entry.section}\u0000${entry.packageKey}`;
    if (!contexts.has(key)) contexts.set(key, []);
    contexts.get(key).push(entry);
  }
  return contexts;
}

function checkClassifiedMarkdown(items, parsed, kind, errors) {
  const expectedSections = kind === "issues" ? PRIORITIES : ["Draft", "Ready for review"];
  const actualSections = parsed.sections.map((section) => section.name);
  add(
    errors,
    sameValue(actualSections, expectedSections),
    `${kind}.md classification sections must be ${expectedSections.join(", ")}`,
  );
  for (const section of parsed.sections) {
    add(
      errors,
      new Set(section.packageKeys).size === section.packageKeys.length,
      `${kind}.md has duplicate package groups in ${section.name}`,
    );
    add(
      errors,
      section.packageKeys.every(
        (key, index) => index === 0 || comparePackageKeys(section.packageKeys[index - 1], key) <= 0,
      ),
      `${kind}.md package groups are not sorted in ${section.name}`,
    );
  }

  const expected = expectedMarkdownContexts(items, kind);
  const actual = actualMarkdownContexts(parsed.entries, kind);
  for (const [key, expectedItems] of expected) {
    const [section, packageKey] = key.split("\u0000");
    const actualItems = actual.get(key) || [];
    const at = `${kind}.md ${section}/${packageKey}`;
    add(
      errors,
      actualItems.length === expectedItems.length,
      `${at} has ${actualItems.length} item links, expected ${expectedItems.length}`,
    );
    const limit = Math.min(actualItems.length, expectedItems.length);
    for (let index = 0; index < limit; index += 1) {
      add(
        errors,
        actualItems[index].url === expectedItems[index].url,
        `${at} link order differs at index ${index}`,
      );
      add(
        errors,
        actualItems[index].label.includes(`#${expectedItems[index].number}`),
        `${at} link label is missing #${expectedItems[index].number}`,
      );
    }
  }
  for (const key of actual.keys()) {
    if (!expected.has(key)) {
      const [section, packageKey] = key.split("\u0000");
      errors.push(`${kind}.md has an unexpected item group ${section}/${packageKey}`);
    }
  }
}

function validateMarkdown(status, repository, issuesMarkdown, pullsMarkdown, errors) {
  add(errors, typeof issuesMarkdown === "string" && issuesMarkdown.length > 0, "issues.md must be non-empty");
  add(errors, typeof pullsMarkdown === "string" && pullsMarkdown.length > 0, "pulls.md must be non-empty");
  if (typeof issuesMarkdown !== "string" || typeof pullsMarkdown !== "string") return;

  checkMarkdownLinks(issuesMarkdown, "issues.md", errors);
  checkMarkdownLinks(pullsMarkdown, "pulls.md", errors);
  add(errors, issuesMarkdown.includes(status.generatedAt), "issues.md is missing generatedAt");
  add(errors, pullsMarkdown.includes(status.generatedAt), "pulls.md is missing generatedAt");

  for (const priority of PRIORITIES) {
    add(
      errors,
      new RegExp(`^## ${priority}$`, "m").test(issuesMarkdown),
      `issues.md is missing the ${priority} section`,
    );
  }
  add(errors, /^## Draft$/m.test(pullsMarkdown), "pulls.md is missing the Draft section");
  add(errors, /^## Ready for review$/m.test(pullsMarkdown), "pulls.md is missing the Ready for review section");

  const expectedIssues = Array.isArray(status.issues) ? status.issues : [];
  const expectedPulls = Array.isArray(status.pulls) ? status.pulls : [];
  checkClassifiedMarkdown(
    expectedIssues,
    parseClassifiedMarkdown(issuesMarkdown, repository, "issues", errors),
    "issues",
    errors,
  );
  checkClassifiedMarkdown(
    expectedPulls,
    parseClassifiedMarkdown(pullsMarkdown, repository, "pull", errors),
    "pulls",
    errors,
  );
}

export async function checkPanelDirectory(directory = DEFAULT_PANEL_DIR) {
  const base = path.resolve(directory);
  const [statusSource, issuesMarkdown, pullsMarkdown] = await Promise.all([
    readFile(path.join(base, "status.json"), "utf8"),
    readFile(path.join(base, "issues.md"), "utf8"),
    readFile(path.join(base, "pulls.md"), "utf8"),
  ]);

  let status;
  try {
    status = JSON.parse(statusSource);
  } catch (error) {
    throw new Error(`status.json is not valid JSON: ${error.message}`);
  }
  const errors = [];
  const repository = validateStatus(status, errors);
  if (repository) validateMarkdown(status, repository.full, issuesMarkdown, pullsMarkdown, errors);
  return { directory: base, status, errors };
}

function parseArguments(argv) {
  const result = {
    directory: process.env.PANEL_DIR?.trim() || DEFAULT_PANEL_DIR,
    fixture: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--fixture") {
      result.fixture = true;
    } else if (argument === "--dir") {
      result.directory = argv[++index] || "";
    } else if (argument.startsWith("--dir=")) {
      result.directory = argument.slice("--dir=".length);
    } else if (argument === "--help" || argument === "-h") {
      result.help = true;
    } else {
      throw new Error(`unknown argument ${JSON.stringify(argument)}`);
    }
  }
  if (!result.directory) throw new Error("--dir must not be empty");
  return result;
}

async function runFixtureCheck() {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "panel-check-"));
  try {
    const panel = createFixturePanel();
    await writePanelFiles(panel, temporaryDirectory);
    const result = await checkPanelDirectory(temporaryDirectory);
    return { ...result, fixture: true };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function printErrors(errors) {
  console.error("panel-check: FAILED");
  for (const error of errors) console.error(`- ${error}`);
}

function isMainModule() {
  const entry = process.argv[1];
  return Boolean(entry) && path.resolve(entry) === fileURLToPath(import.meta.url);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log("usage: node scripts/panel-check.mjs [--fixture] [--dir DIR]");
    return;
  }
  const result = options.fixture ? await runFixtureCheck() : await checkPanelDirectory(options.directory);
  if (result.errors.length > 0) {
    printErrors(result.errors);
    process.exitCode = 1;
    return;
  }
  const mode = result.fixture ? "fixture" : result.directory;
  console.log(
    `panel-check: OK (${mode}; ${result.status.summary.issueCount} issues, ${result.status.summary.pullCount} pull requests)`,
  );
}

if (isMainModule()) {
  main().catch((error) => {
    console.error(`panel-check: ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}
