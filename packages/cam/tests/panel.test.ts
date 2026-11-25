import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";
import { onRequest } from "../src/hooks.ts";
import { writeLiveData } from "../src/live-data.ts";
import { getPolicyWithOptions, keyFor, recordSession } from "../src/store.ts";

const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const OTHER_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const dataUrl = (data = PNG) => `data:image/png;base64,${data}`;
const panelKey = keyFor("codex", "panel-thread");
let root: string;
let panelDir: string;

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), "magpie-cam-panel-"));
  panelDir = mkdtempSync(join(tmpdir(), "magpie-cam-panel-view-"));
  await onRequest({
    model: "test/model",
    input: [{ type: "message", role: "user", content: [{ type: "input_text", text: "hello" }, { type: "input_image", image_url: dataUrl() }] }],
    tools: [{ name: "cam_view_image" }],
  }, {
    protocol: "responses",
    path: "/responses",
    origin: "local",
    agent: "codex",
    session: "panel-thread",
    options: { dataDir: root, panelDir, language: "en" },
    report() {},
  });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(panelDir, { recursive: true, force: true });
});

describe("static attachment panel", () => {
  test("shows attachments but prevents policy edits if the host cannot supply options", async () => {
    const source = readFileSync(new URL("../panel/app.js", import.meta.url), "utf8");
    const nodes: Record<string, any> = {};
    const element = () => ({ dataset: {}, append() {}, replaceChildren() {}, setAttribute() {}, textContent: "" });
    const buttons: any[] = [];
    let hostAvailable = false;
    let writes = 0;
    const environment = createContext({
      panelKey,
      location: {},
      setTimeout,
      clearTimeout,
      document: {
        getElementById: (id: string) => (nodes[id] ??= element()),
        querySelectorAll: () => [],
        createElement: (tag: string) => {
          const node = element();
          if (tag === "button") buttons.push(node);
          return node;
        },
      },
      IntersectionObserver: class {
        observe() {}
        disconnect() {}
      },
      magpie: {
        ready: new Promise(() => {}),
        options: {
          get: async () => {
            if (!hostAvailable) throw new Error("Host unavailable");
            return { auto: false };
          },
          set: async () => {
            writes++;
          },
        },
      },
    });
    runInContext(`${source}
      live.details[panelKey] = {
        session: { key: panelKey, platform: "codex" },
        legacyPolicy: { pinnedContentIds: [] },
        images: [{ id: "IMG-001", contentId: "a".repeat(64), stored: true }]
      };
    `, environment);
    await runInContext("loadDetail(panelKey)", environment);
    expect(nodes.count.textContent).toBe(1);
    expect(nodes.auto.disabled).toBeTrue();
    expect(nodes.auto.indeterminate).toBeTrue();
    expect(buttons.at(-1).disabled).toBeTrue();
    await runInContext('$("auto").onchange({ target: { checked: true } })', environment);
    expect(writes).toBe(0);
    hostAvailable = true;
    await runInContext("loadDetail(panelKey)", environment);
    expect(nodes.auto.disabled).toBeFalse();
    expect(nodes.auto.checked).toBeFalse();
  });

  test("native and web page scripts save through the same host options", async () => {
    const source = readFileSync(new URL("../panel/app.js", import.meta.url), "utf8");
    const previouslyPinned = "a".repeat(64);
    const newPin = "b".repeat(64);
    let options: Record<string, any> = {
      language: "en",
      sessionPolicies: {
        other: { auto: false },
        [panelKey]: { version: 2, auto: true, pinnedContentIds: [previouslyPinned] },
      },
    };
    for (const native of [true, false]) {
      const elements: Record<string, Record<string, unknown>> = {};
      const environment = createContext({
        native,
        newPin,
        panelKey,
        setTimeout,
        clearTimeout,
        document: {
          getElementById: (id: string) => (elements[id] ??= {}),
          querySelectorAll: () => [],
        },
        magpie: {
          ready: new Promise(() => {}),
          options: {
            get: async () => structuredClone(options),
            set: async (next: typeof options) => (options = structuredClone(next)),
          },
        },
        fetch: () => {
          throw new Error("Policy saves must use host options");
        },
      });
      await runInContext(`${source}
        current = { session: { key: panelKey }, policy: { auto: true, pinnedContentIds: [] }, legacyPolicy: { auto: true, pinnedContentIds: [] } };
        renderDetail = () => {};
        toast = (message, error) => { if (error) throw new Error(message); };
        native ? $("auto").onchange({ target: { checked: false } }) : togglePin(newPin);
      `, environment);
    }
    expect(options.language).toBe("en");
    expect(options.sessionPolicies.other).toEqual({ auto: false });
    expect(options.sessionPolicies[panelKey]).toEqual({ version: 2, auto: false, pinnedContentIds: [previouslyPinned, newPin] });
    expect(getPolicyWithOptions(root, panelKey, true, options)).toEqual({ auto: false, pinnedContentIds: [previouslyPinned, newPin] });
  });

  test("the panel uses the current host default unless a legacy file explicitly sets auto", () => {
    const source = readFileSync(new URL("../panel/app.js", import.meta.url), "utf8");
    const environment = createContext({
      panelKey,
      document: { getElementById: () => ({}) },
      magpie: { ready: new Promise(() => {}) },
    });
    const readAuto = (legacyPolicy: string) => runInContext(`effectivePolicy(
      { session: { key: panelKey }, policy: { auto: true, pinnedContentIds: [] }, legacyPolicy: ${legacyPolicy} },
      { auto: false }).auto`, environment);
    runInContext(source, environment);
    expect(readAuto("{ pinnedContentIds: [] }")).toBeFalse();
    expect(readAuto("{ auto: true, pinnedContentIds: [] }")).toBeTrue();
    expect(readAuto("undefined")).toBeFalse();
  });

  test("publishes the last session recorded inside the throttle window", async () => {
    const snapshot = join(panelDir, "live.js");
    writeLiveData(root, true, panelDir);
    const key = keyFor("codex", "trailing-session");
    recordSession(root, { key, named: "trailing-session", platform: "codex", protocol: "responses", model: "test" });
    writeLiveData(root, false, panelDir);
    expect(readFileSync(snapshot, "utf8")).not.toContain(key);
    const deadline = Date.now() + 2200;
    while (!readFileSync(snapshot, "utf8").includes(key) && Date.now() < deadline) await Bun.sleep(50);
    expect(readFileSync(snapshot, "utf8")).toContain(key);
  });

  test("publishes live data and static thumbnails into the supplied panel directory", () => {
    writeLiveData(root, true, panelDir);
    const snapshot = readFileSync(join(panelDir, "live.js"), "utf8");
    const detail = JSON.parse(snapshot.slice(snapshot.indexOf("=") + 1).trimEnd().slice(0, -1)).details[panelKey];
    expect(detail.legacyPolicy).toEqual({ pinnedContentIds: [] });
    expect(detail).not.toHaveProperty("policy");
    expect(detail.images[0]).not.toHaveProperty("pinned");
    const digest = createHash("sha256").update(PNG).digest("hex");
    expect(existsSync(join(panelDir, "images", panelKey, `IMG-001-${digest}.png`))).toBeTrue();
    const app = readFileSync(new URL("../panel/app.js", import.meta.url), "utf8");
    expect(app).toContain("loadLive");
  });

  test("publishes a different thumbnail when a data directory reuses an image id", async () => {
    const secondRoot = mkdtempSync(join(tmpdir(), "magpie-cam-panel-other-"));
    try {
      writeLiveData(root, true, panelDir);
      await onRequest({
        input: [{ type: "message", role: "user", content: [{ type: "input_text", text: "hello" }, { type: "input_image", image_url: dataUrl(OTHER_PNG) }] }],
      }, {
        protocol: "responses",
        path: "/responses",
        origin: "local",
        agent: "codex",
        session: "panel-thread",
        options: { dataDir: secondRoot, panelDir, language: "en" },
        report() {},
      });
      writeLiveData(secondRoot, true, panelDir);
      const digest = createHash("sha256").update(OTHER_PNG).digest("hex");
      const thumbnail = join(panelDir, "images", panelKey, `IMG-001-${digest}.png`);
      expect(readFileSync(thumbnail).toString("base64")).toBe(OTHER_PNG);
    } finally {
      rmSync(secondRoot, { recursive: true, force: true });
    }
  });
});
