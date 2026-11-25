// plugins#1489: Qoder queues a DSH prompt in p2 while answering the same
// request after WorkBuddy's hide_dsh rewriting. The switch is on by default
// for Qoder and Qoder CN, and only changes what Qoder is sent.
import { afterEach, expect, test } from "bun:test"
import { QoderAuthPlugin, QoderCNAuthPlugin, _internal } from "./index.mjs"

const real = globalThis.fetch
afterEach(() => (globalThis.fetch = real))

const OPENER = "You are an AI agent powered by DeepSeekRuntime."
const SOURCE =
  "The runtime context names the DeepSeekRuntime implementation checkout. Use this checkout only to inspect or extend DSH itself."
const BADGE =
  "Add the official “powered by dsh” badge to content produced with DeepSeekRuntime. Use whenever creating a pull request."
const ASKED = "Bash 绝对路径: /root/DSH/Work/OC-182.92.66.95/ 请原样复述这个路径"
const named = (s) => /DeepSeekRuntime|\bDSH\b(?!_)/.test(s)

const chatBody = () => ({
  model: "dfmodel",
  stream: true,
  messages: [
    { role: "system", content: [OPENER, SOURCE].join("\n\n") },
    { role: "user", content: [{ type: "text", text: ASKED }] },
    { role: "assistant", content: "I run in DeepSeekRuntime; DSH_HOME is ~/.dsh." },
    { role: "tool", tool_call_id: "c1", content: "README: DeepSeekRuntime (DSH) is …" },
  ],
  tools: [{ type: "function", function: { name: "dsh-badge", description: BADGE, parameters: { type: "object", properties: { at: { type: "string", description: "where DSH puts it" } } } } }],
})

const json = (v) => new Response(JSON.stringify(v), { headers: { "Content-Type": "application/json" } })
const line = (body) => `data:${JSON.stringify({ headers: {}, body: typeof body === "string" ? body : JSON.stringify(body), statusCodeValue: 200 })}\n\n`
const answered = () =>
  new Response(line({ choices: [{ delta: { content: "ok" } }] }) + line({ choices: [{ delta: {}, finish_reason: "stop" }] }) + line("[DONE]"), {
    headers: { "Content-Type": "text/event-stream" },
  })

const magpieWith = (v) => ({ option: (provider, key) => (key in (v[provider] ?? {}) ? v[provider][key] : key === _internal.HIDE_DSH) })

async function run(make, id, magpie) {
  const auth = { type: "oauth", access: "jt", refresh: "rt", expires: Date.now() + 3_600_000, accountId: "one@x", uid: "u1", machineId: "m1" }
  const sent = []
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input?.url ?? input)
    const wire = init.body == null ? "" : typeof init.body === "string" ? init.body : new TextDecoder().decode(init.body)
    sent.push({ url, wire })
    if (new URL(url).pathname.endsWith("/model/list")) return json({ app: [{ key: "dfmodel", display_name: "DeepSeek Flash", enable: true }] })
    return answered()
  }
  const hooks = await make({ client: { auth: { set: async () => {} } }, magpie })
  const option = hooks.auth.options.find((x) => x.key === _internal.HIDE_DSH)
  const loader = await hooks.auth.loader(async () => auth)
  const res = await loader.fetch("https://api3.qoder.sh/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify(chatBody()),
  })
  expect(res.status).toBe(200)
  await res.text()
  const chat = sent.find((s) => !new URL(s.url).pathname.endsWith("/model/list"))
  return { body: JSON.parse(_internal.decodeBody(chat.wire)), option, sent }
}

test("dshHidden: DSH's own prose loses the name; paths and identifiers stay", () => {
  const h = _internal.dshHidden
  expect(h(OPENER)).toBe("You are an AI agent.")
  expect(h("You are an AI agent, powered by DeepSeekRuntime.")).toBe("You are an AI agent.")
  expect(h(SOURCE)).toBe(
    "The runtime context names the agent implementation checkout. Use this checkout only to inspect or extend the agent itself.",
  )
  for (const s of ["/root/DSH/Work/", "C:\\Users\\me\\DSH\\x", "see DSH.md", "~/DSH", "DSH_HOME=~/.dsh dsh-session:abc"]) {
    expect(h(s)).toBe(s)
  }
  expect(h("Use DSH. It runs (DSH), and DSH, too")).toBe("Use the agent harness. It runs (the agent harness), and the agent harness, too")
})

test("hideDsh: system and tool descriptions change, tool results and user paths do not", () => {
  const chat = chatBody()
  expect(_internal.hideDsh(chat)).toBe(true)
  expect(named(chat.messages[0].content)).toBe(false)
  expect(chat.messages[1].content[0].text).toBe(ASKED)
  expect(chat.messages[2].content).toBe("I run in DeepSeekRuntime; DSH_HOME is ~/.dsh.")
  expect(chat.messages[3].content).toBe("README: DeepSeekRuntime (DSH) is …")
  expect(named(chat.tools[0].function.description)).toBe(false)
  expect(chat.tools[0].function.name).toBe("dsh-badge")
})

for (const [make, id] of [
  [QoderAuthPlugin, "qoder"],
  [QoderCNAuthPlugin, "qoder-cn"],
]) {
  test(`${id}: declares the switch, on by default`, async () => {
    const { option } = await run(make, id, magpieWith({}))
    expect(option.default).toBe(true)
    expect(option.label.length).toBeLessThanOrEqual(60)
    expect(option.description.length).toBeLessThanOrEqual(300)
    for (const l of ["zh", "zh-TW", "ja", "de"]) {
      expect(option.labels[l]).toBeTruthy()
      expect(option.descriptions[l]).toBeTruthy()
    }
  })

  test(`${id}: dsh's name does not reach the prompt or tools`, async () => {
    const { body } = await run(make, id, magpieWith({}))
    expect(named(body.system[0].text)).toBe(false)
    expect(named(body.tools[0].function.description)).toBe(false)
    expect(body.messages[1].content[0].text).toBe(ASKED)
    expect(JSON.stringify(body.messages)).toContain("I run in DeepSeekRuntime; DSH_HOME is ~/.dsh.")
    expect(JSON.stringify(body.messages)).toContain("README: DeepSeekRuntime (DSH) is …")
  })

  test(`${id}: turned off, the prompt and tool description keep DSH's name`, async () => {
    const { body } = await run(make, id, magpieWith({ [id]: { [_internal.HIDE_DSH]: false } }))
    expect(body.system[0].text).toContain("powered by DeepSeekRuntime")
    expect(body.tools[0].function.description).toContain("DeepSeekRuntime")
  })
}
