const state = {
  status: null,
  seed: null,
  type: "all",
  risk: "all",
  packageName: "all",
  query: "",
};

const riskRank = { P0: 0, P1: 1, P2: 2, P3: 3 };
const elements = {
  generatedAt: document.querySelector("#generated-at"),
  issueCount: document.querySelector("#issue-count"),
  pullCount: document.querySelector("#pull-count"),
  draftCount: document.querySelector("#draft-count"),
  priorityCount: document.querySelector("#priority-count"),
  clusterCount: document.querySelector("#cluster-count"),
  priorityList: document.querySelector("#priority-list"),
  resultCount: document.querySelector("#result-count"),
  rows: document.querySelector("#item-rows"),
  empty: document.querySelector("#empty-state"),
  error: document.querySelector("#error-state"),
  search: document.querySelector("#search"),
  risk: document.querySelector("#risk-filter"),
  packageName: document.querySelector("#package-filter"),
  typeButtons: [...document.querySelectorAll("[data-type]")],
};

function formatDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function packageOf(item) {
  return (item.package || item.packageDirectory || "unclassified").replace(
    /^@magpie-community\//,
    "",
  );
}

function normalizedItems() {
  if (!state.status) return [];
  return [
    ...state.status.issues.map((item) => ({ ...item, type: "issue" })),
    ...state.status.pulls.map((item) => ({ ...item, type: "pull" })),
  ].sort(
    (left, right) =>
      riskRank[left.priority] - riskRank[right.priority] ||
      Date.parse(right.updatedAt) - Date.parse(left.updatedAt) ||
      right.comments - left.comments ||
      right.number - left.number,
  );
}

function priorityItems() {
  if (!state.seed) return [];
  return [
    ...state.seed.priority_issues.map((item) => ({ ...item, type: "issue" })),
    ...state.seed.priority_prs.map((item) => ({ ...item, type: "pull" })),
  ]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 10);
}

function renderSummary() {
  const summary = state.status.summary;
  elements.issueCount.textContent = String(summary.issueCount);
  elements.pullCount.textContent = String(summary.pullCount);
  elements.draftCount.textContent = `${summary.draftPullCount} drafts`;
  elements.priorityCount.textContent = String(
    state.seed.priority_issues.length + state.seed.priority_prs.length,
  );
  elements.clusterCount.textContent = String(state.seed.summary.package_clusters_total);
  elements.generatedAt.textContent = `Snapshot ${formatDate(state.status.generatedAt)}`;
}

function renderPriority() {
  const items = priorityItems();
  elements.priorityList.replaceChildren();
  for (const item of items) {
    const row = document.createElement("li");
    row.className = "priority-item";

    const rank = document.createElement("span");
    rank.className = "priority-rank";
    rank.textContent = String(item.rank).padStart(2, "0");

    const body = document.createElement("div");
    const link = document.createElement("a");
    link.href = `https://github.com/magpie-community/plugins/${item.type === "issue" ? "issues" : "pull"}/${item.number}`;
    link.textContent = `#${item.number} ${item.title}`;
    link.target = "_blank";
    link.rel = "noreferrer";

    const meta = document.createElement("div");
    meta.className = "priority-meta";
    const risk = document.createElement("span");
    risk.className = `risk risk-${item.risk}`;
    risk.textContent = item.risk;
    const packageName = document.createElement("span");
    packageName.className = "priority-package";
    packageName.textContent = packageOf(item);
    meta.append(risk, packageName);
    body.append(link, meta);
    row.append(rank, body);
    elements.priorityList.append(row);
  }
}

function renderPackageFilter() {
  const packages = [...new Set(normalizedItems().map(packageOf))].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  for (const packageName of packages) {
    const option = document.createElement("option");
    option.value = packageName;
    option.textContent = packageName;
    elements.packageName.append(option);
  }
}

function filteredItems() {
  const query = state.query.trim().toLowerCase();
  return normalizedItems().filter((item) => {
    if (state.type !== "all" && item.type !== state.type) return false;
    if (state.risk !== "all" && item.priority !== state.risk) return false;
    if (state.packageName !== "all" && packageOf(item) !== state.packageName) return false;
    if (!query) return true;
    return [String(item.number), item.title, packageOf(item), item.author || ""]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function makeCell(className) {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  return cell;
}

function renderRows() {
  const items = filteredItems();
  elements.resultCount.textContent = `${items.length} shown`;
  elements.rows.replaceChildren();
  elements.empty.hidden = items.length !== 0;
  for (const item of items) {
    const row = document.createElement("tr");

    const riskCell = makeCell();
    const risk = document.createElement("span");
    risk.className = `risk risk-${item.priority}`;
    risk.textContent = item.priority;
    riskCell.append(risk);

    const typeCell = makeCell();
    const type = document.createElement("span");
    type.className = `type-badge type-${item.type}`;
    type.textContent = item.type === "issue" ? "Issue" : "PR";
    typeCell.append(type);

    const packageCell = makeCell("package-name");
    packageCell.textContent = packageOf(item);

    const itemCell = makeCell();
    const link = document.createElement("a");
    link.className = "item-link";
    link.href = `https://github.com/magpie-community/plugins/${item.type === "issue" ? "issues" : "pull"}/${item.number}`;
    link.textContent = `#${item.number} ${item.title}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    itemCell.append(link);

    const activityCell = makeCell("activity");
    activityCell.textContent = `${item.comments} comments`;

    const updatedCell = makeCell("updated");
    updatedCell.textContent = formatDate(item.updatedAt);

    row.append(riskCell, typeCell, packageCell, itemCell, activityCell, updatedCell);
    elements.rows.append(row);
  }
}

function renderAll() {
  renderSummary();
  renderPriority();
  renderPackageFilter();
  renderRows();
}

async function load() {
  try {
    const [statusResponse, seedResponse] = await Promise.all([
      fetch("./status.json", { cache: "no-store" }),
      fetch("./triage-seed.json", { cache: "no-store" }),
    ]);
    if (!statusResponse.ok || !seedResponse.ok) {
      throw new Error(`Snapshot request failed: ${statusResponse.status}/${seedResponse.status}`);
    }
    [state.status, state.seed] = await Promise.all([
      statusResponse.json(),
      seedResponse.json(),
    ]);
    renderAll();
  } catch (error) {
    console.error(error.stack || error);
    elements.error.hidden = false;
    elements.resultCount.textContent = "Unavailable";
    elements.generatedAt.textContent = "Snapshot unavailable";
  }
}

elements.search.addEventListener("input", (event) => {
  state.query = event.currentTarget.value;
  renderRows();
});

elements.risk.addEventListener("change", (event) => {
  state.risk = event.currentTarget.value;
  renderRows();
});

elements.packageName.addEventListener("change", (event) => {
  state.packageName = event.currentTarget.value;
  renderRows();
});

for (const button of elements.typeButtons) {
  button.addEventListener("click", () => {
    state.type = button.dataset.type;
    for (const candidate of elements.typeButtons) {
      candidate.classList.toggle("active", candidate === button);
    }
    renderRows();
  });
}

load();
