import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../src/main.ts";

const visit = "0b9f8a52-3c1d-4e6f-8a7b-1c2d3e4f5a6b";
const good = { visit, path: "/", name: "content_explored", props: { section: "quests", action: "open-tool", item: "shiplane" } };
const send = async (body: unknown, { origin = "https://me.dev", method = "POST", success = true } = {}) => {
  const kept: unknown[] = [];
  const request = new Request("https://c.dev/", { method, headers: { origin, "cf-connecting-ip": "203.0.113.7", "user-agent": "Secret" }, body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined });
  const { status } = await worker.fetch(request, { EVENTS: { writeDataPoint: (p) => { kept.push(p); } }, ALLOWED_ORIGIN: "https://me.dev", LIMITER: { limit: async () => ({ success }) } });
  return { status, kept };
};

test("a planned event is kept, without address or browser", async () => {
  assert.deepEqual(await send(good), { status: 204, kept: [{ indexes: [visit], blobs: ["content_explored", "/", "quests", "", "shiplane", "", "", "open-tool"], doubles: [0] }] });
});
test("anything else is refused and not kept", async () => {
  const cases = [
    [await send("{"), 400], [await send("null"), 400], [await send({ ...good, name: "other" }), 400],
    [await send({ ...good, props: { ...good.props, email: "x" } }), 400], [await send({ ...good, visit: "me" }), 400],
    [await send({ ...good, path: "/?q=1" }), 400], [await send("x".repeat(3000)), 413],
    [await send(good, { origin: "https://evil.dev" }), 403], [await send(good, { method: "GET" }), 405],
    [await send(good, { success: false }), 429],
  ] as const;
  for (const [r, status] of cases) { assert.equal(r.status, status); assert.deepEqual(r.kept, []); }
});
