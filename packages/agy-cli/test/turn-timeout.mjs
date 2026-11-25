// The bridge's own read cutoff (AGY_BRIDGE_TURN_TIMEOUT_MS, agy silent with
// nothing streamed) ends the turn as a 504 the gateway can route on, not a
// bare api_error. magpie#7736: an oversized single write hit the 5-minute
// cutoff three times in a session, each answered 200 api_error with no
// distinguishable signal, and the agent retried the same unfinishable
// attempt blind.

import { test } from "node:test"
import assert from "node:assert/strict"
import { baseBody, continueWithToolResults, createBridgeKit, readSse, sleep } from "./testkit.mjs"

async function withKit(options, fn) {
  const kit = await createBridgeKit(options)
  try {
    return await fn(kit)
  } finally {
    await kit.dispose()
  }
}

test("a stalled agy turn ends as a 504, not a bare api_error", async () => {
  for (const stream of [true, false]) {
    await withKit({ env: { AGY_BRIDGE_TURN_TIMEOUT_MS: "300" } }, async (kit) => {
      kit.defaultPrompt = () => new Promise(() => {})
      const response = await kit.request(baseBody({
        metadata: { user_id: `cutoff-${stream}` },
        messages: [{ role: "user", content: "write a very large app.js in one go" }],
        stream,
      }))
      if (stream) {
        const result = await readSse(response)
        assert.equal(result.error?.type, "api_error")
        assert.equal(result.error?.status, 504)
        assert.equal(result.error?.noRetry, true)
        assert.match(result.error?.message || "", /timed out reading agy output after 300ms/)
        assert.match(result.error?.message || "", /stderr tail: \(empty\)/)
      } else {
        const body = await response.json()
        assert.equal(response.status, 504)
        assert.equal(body.error?.type, "api_error")
        assert.equal(body.error?.status, 504)
        assert.equal(body.error?.noRetry, true)
        assert.equal(response.headers.get("x-should-retry"), "false")
        assert.match(body.error?.message || "", /timed out reading agy output after 300ms/)
      }
    })
  }
})

test("agy output renews the inactivity deadline", async () => {
  await withKit({ env: { AGY_BRIDGE_TURN_TIMEOUT_MS: "800" } }, async (kit) => {
    kit.defaultPrompt = async (agent) => {
      for (let i = 0; i < 6; i++) {
        await agent.text("x")
        if (i < 5) await sleep(200)
      }
      return { stopReason: "end_turn" }
    }
    const result = await readSse(await kit.request(baseBody({
      messages: [{ role: "user", content: "write a long reply" }],
    })))
    assert.equal(result.error, null)
    assert.equal(result.content.filter((block) => block.type === "text").map((block) => block.text).join(""), "xxxxxx")
  })
})

test("waiting for a client tool result keeps its own timeout shape", async () => {
  await withKit({
    env: { AGY_BRIDGE_TURN_TIMEOUT_MS: "1000", AGY_BRIDGE_TOOL_TIMEOUT_MS: "1000" },
  }, async (kit) => {
    kit.defaultPrompt = async (agent) => {
      await agent.tool("Read", { path: "/repo/never.txt" })
      await new Promise(() => {})
    }
    const opening = baseBody({
      metadata: { user_id: "cutoff-tool-wait" },
      messages: [{ role: "user", content: "read a file" }],
    })
    const first = await readSse(await kit.request(opening))
    assert.equal(first.stopReason, "tool_use")
    await sleep(1300)
    const result = await readSse(await kit.request(continueWithToolResults(opening, first, () => "too late")))
    assert.match(result.error?.message || "", /timed out waiting for a client tool result/)
    assert.equal(result.error?.status, undefined)
    assert.notEqual(result.error?.noRetry, true)
  })
})
