// plugins#1491: Codex's view_image result is a whole tool_result output. When
// image-slim replaces that earlier output with its placeholder, agy already
// has the image and the live ACP session should stay in use.

import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { baseBody, continueWithToolResults, createBridgeKit, readSse } from "./testkit.mjs"

function captureStderr() {
  const lines = []
  const original = process.stderr.write
  process.stderr.write = function write(chunk, ...rest) {
    const text = String(chunk)
    if (text.startsWith("[agy-bridge] ")) {
      lines.push(JSON.parse(text.slice("[agy-bridge] ".length)))
      return true
    }
    return original.call(this, chunk, ...rest)
  }
  return { lines, restore: () => { process.stderr.write = original } }
}

const IMAGE = {
  type: "image",
  source: {
    type: "base64",
    media_type: "image/png",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=",
  },
}
const VIEW_IMAGE = {
  name: "view_image",
  description: "View a local image",
  input_schema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
}
const SLIM = "[1.42 MB image left out here: a view_image result, already seen earlier in this conversation. It is the file /tmp/shot.png; call view_image on that path if you need to look at it again.]"

test("an earlier view_image placeholder keeps the live ACP session", async () => {
  const stderr = captureStderr()
  const kit = await createBridgeKit({ promptImages: true })
  try {
    let promptCount = 0
    kit.defaultPrompt = async (agent) => {
      promptCount++
      if (promptCount === 1) {
        await agent.tool("view_image", { path: "/tmp/shot.png" })
        await agent.text("the button is misaligned")
      } else {
        await agent.text("the live session remembered the image")
      }
      return { stopReason: "end_turn" }
    }

    const opening = baseBody({
      tools: [VIEW_IMAGE],
      messages: [{ role: "user", content: "look at the screenshot" }],
    })
    const first = await readSse(await kit.request(opening))
    assert.equal(first.stopReason, "tool_use")
    assert.equal(first.content.filter((block) => block.type === "tool_use").length, 1)

    const withImage = continueWithToolResults(opening, first, () => [IMAGE])
    const completed = await readSse(await kit.request(withImage))
    assert.equal(completed.stopReason, "end_turn")
    assert.equal(completed.error, null)

    const history = [
      ...withImage.messages,
      { role: "assistant", content: completed.content },
    ]
    const slimmed = structuredClone(history)
    const toolResult = slimmed.find((message) => Array.isArray(message.content) &&
      message.content.some((block) => block.type === "tool_result"))
      .content.find((block) => block.type === "tool_result")
    toolResult.content = SLIM
    slimmed.push({ role: "user", content: "what did you see earlier?" })

    const followUp = await readSse(await kit.request(baseBody({
      tools: [VIEW_IMAGE],
      messages: slimmed,
    })))
    assert.equal(followUp.stopReason, "end_turn")
    assert.equal(followUp.error, null)

    const sessions = kit.acpLog.filter((entry) => entry.method === "session/new")
    const prompts = kit.acpLog.filter((entry) => entry.method === "session/prompt")
    assert.equal(sessions.length, 1, JSON.stringify(sessions))
    assert.ok(prompts.length >= 3, JSON.stringify(prompts))
    assert.deepEqual([...new Set(prompts.map((entry) => entry.params.sessionId))], ["fake-session-1"])
    assert.equal(kit.acpSpawns.length, 1)
    assert.ok(!stderr.lines.some((line) => line.action === "drop_live"),
      JSON.stringify(stderr.lines.filter((line) => line.action === "drop_live")))

    const logText = JSON.stringify(stderr.lines)
    assert.ok(!logText.includes(IMAGE.source.data), "image bytes leaked into a log")
    assert.ok(!logText.includes(SLIM), "placeholder text leaked into a log")

    const stateFile = path.join(kit.env.XDG_STATE_HOME, "magpie-agy-bridge", "sessions.json")
    assert.ok(fs.existsSync(stateFile), `session state was not written: ${stateFile}`)
    const stateText = fs.readFileSync(stateFile, "utf8")
    assert.ok(!stateText.includes(IMAGE.source.data), "image bytes leaked into persisted session state")
    assert.ok(!stateText.includes(SLIM), "placeholder text leaked into persisted session state")
  } finally {
    stderr.restore()
    await kit.dispose()
  }
})
