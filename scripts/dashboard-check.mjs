#!/usr/bin/env node

import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dashboardRoot = path.join(root, "panel")
const outputRoot = path.join(root, ".sandbox")
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
])

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean)
  return candidates[0]
}

function staticServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1")
      const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1))
      const file = path.resolve(dashboardRoot, requested)
      if (!file.startsWith(`${dashboardRoot}${path.sep}`)) {
        response.writeHead(403).end("Forbidden")
        return
      }
      const body = await readFile(file)
      response.writeHead(200, {
        "content-type": mime.get(path.extname(file)) || "application/octet-stream",
        "cache-control": "no-store",
      })
      response.end(body)
    } catch {
      response.writeHead(404).end("Not found")
    }
  })
  return new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      resolve({ server, url: `http://127.0.0.1:${address.port}/` })
    })
  })
}

async function waitForFile(file, timeout = 10_000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    try {
      return await readFile(file, "utf8")
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  throw new Error(`timed out waiting for ${file}`)
}

async function waitForExit(child, timeout = 5_000) {
  if (child.exitCode !== null) return
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, timeout)),
  ])
}

async function removeWithRetry(directory, attempts = 10) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await rm(directory, { recursive: true, force: true })
      return
    } catch (error) {
      if (attempt === attempts - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
}

class CDP {
  constructor(url) {
    this.nextId = 1
    this.pending = new Map()
    this.events = new Map()
    this.socket = new WebSocket(url)
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true })
      this.socket.addEventListener("error", reject, { once: true })
    })
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data)
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result)
        return
      }
      const listeners = this.events.get(message.method) || []
      this.events.delete(message.method)
      for (const listener of listeners) listener(message.params)
    })
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  waitEvent(method, timeout = 10_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timed out waiting for ${method}`)), timeout)
      const listener = (params) => {
        clearTimeout(timer)
        resolve(params)
      }
      const listeners = this.events.get(method) || []
      listeners.push(listener)
      this.events.set(method, listeners)
    })
  }

  close() {
    this.socket.close()
  }
}

async function waitForDashboard(cdp) {
  const status = JSON.parse(await readFile(path.join(dashboardRoot, "status.json"), "utf8"))
  const expectedCount = String(status.summary.issueCount)
  const result = await cdp.send("Runtime.evaluate", {
    expression: `new Promise((resolve) => {
      const started = Date.now();
      const check = () => {
        const count = document.querySelector("#issue-count")?.textContent;
        const candidates = document.querySelector("#candidate-count")?.textContent;
        const rows = document.querySelectorAll("#item-rows tr").length;
        if (count === ${JSON.stringify(expectedCount)} && candidates !== "-" && rows > 300) resolve({ ok: true, count, candidates, rows });
        else if (Date.now() - started > 10000) resolve({ ok: false, count, candidates, rows });
        else setTimeout(check, 100);
      };
      check();
    })`,
    awaitPromise: true,
    returnByValue: true,
  })
  if (!result.result.value.ok) throw new Error(`dashboard did not load: ${JSON.stringify(result.result.value)}`)
  return result.result.value
}

async function screenshot(cdp, file) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  })
  await writeFile(file, Buffer.from(result.data, "base64"))
}

async function layout(cdp) {
  const result = await cdp.send("Runtime.evaluate", {
    expression: `({
      innerWidth: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      tableWidth: document.querySelector(".table-shell")?.scrollWidth || 0,
      tableClientWidth: document.querySelector(".table-shell")?.clientWidth || 0
    })`,
    returnByValue: true,
  })
  return result.result.value
}

async function interact(cdp, issueNumber) {
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('button[data-type="issue"]').click()`,
  })
  await new Promise((resolve) => setTimeout(resolve, 100))
  const issueOnly = await cdp.send("Runtime.evaluate", {
    expression: `[...document.querySelectorAll(".type-badge")].every((node) => node.textContent === "Issue")`,
    returnByValue: true,
  })
  if (!issueOnly.result.value) throw new Error("issue filter did not hold")

  await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const input = document.querySelector("#search");
      input.value = ${JSON.stringify(String(issueNumber))};
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`,
  })
  await new Promise((resolve) => setTimeout(resolve, 100))
  const searchRows = await cdp.send("Runtime.evaluate", {
    expression: `document.querySelectorAll("#item-rows tr").length`,
    returnByValue: true,
  })
  if (searchRows.result.value !== 1) throw new Error(`search returned ${searchRows.result.value} rows`)
}

async function main() {
  const executable = chromePath()
  if (!executable) throw new Error("Chrome or Edge was not found; set CHROME_PATH")
  const profile = await mkdtemp(path.join(tmpdir(), "magpie-dashboard-chrome-"))
  const { server, url } = await staticServer()
  const chrome = spawn(
    executable,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  )

  let cdp
  try {
    const activePort = await waitForFile(path.join(profile, "DevToolsActivePort"))
    const [port, browserPath] = activePort.trim().split(/\r?\n/)
    const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json())
    const target = await fetch(
      `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
      { method: "PUT" },
    ).then((response) => response.json())
    cdp = new CDP(target.webSocketDebuggerUrl)
    await cdp.open()
    await cdp.send("Page.enable")
    await cdp.send("Runtime.enable")

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1200,
      deviceScaleFactor: 1,
      mobile: false,
    })
    const loaded = cdp.waitEvent("Page.loadEventFired")
    await cdp.send("Page.navigate", { url })
    await loaded
    const data = await waitForDashboard(cdp)
    const status = JSON.parse(await readFile(path.join(dashboardRoot, "status.json"), "utf8"))
    const issueNumber = status.issues[0]?.number
    if (!Number.isSafeInteger(issueNumber)) throw new Error("dashboard snapshot has no open issue to search")
    await mkdir(outputRoot, { recursive: true })
    const desktop = path.join(outputRoot, "dashboard-desktop.png")
    await screenshot(cdp, desktop)
    await interact(cdp, issueNumber)

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    const reloaded = cdp.waitEvent("Page.loadEventFired")
    await cdp.send("Page.reload", { ignoreCache: true })
    await reloaded
    await waitForDashboard(cdp)
    const mobileLayout = await layout(cdp)
    if (mobileLayout.pageWidth > mobileLayout.innerWidth + 1) {
      throw new Error(`mobile page overflows: ${JSON.stringify(mobileLayout)}`)
    }
    if (mobileLayout.tableWidth <= mobileLayout.tableClientWidth) {
      throw new Error(`mobile table does not scroll internally: ${JSON.stringify(mobileLayout)}`)
    }
    const mobile = path.join(outputRoot, "dashboard-mobile.png")
    await screenshot(cdp, mobile)

    console.log(
      JSON.stringify(
        {
          ok: true,
          browser: version.Browser,
          data,
          mobileLayout,
          screenshots: { desktop, mobile },
        },
        null,
        2,
      ),
    )
  } finally {
    cdp?.close()
    chrome.kill()
    await waitForExit(chrome)
    server.close()
    await removeWithRetry(profile)
  }
}

main().catch((error) => {
  console.error(`dashboard-check: ${error.stack || error.message}`)
  process.exitCode = 1
})
