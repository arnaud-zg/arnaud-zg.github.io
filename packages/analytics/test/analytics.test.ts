import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalytics } from "../src/application/analytics.ts";
import { CHOICE_LASTS_MS, type SavedChoice } from "../src/domain/consent.ts";
import { destinationOf, PLAN_VERSION, sourceOf, toEvent } from "../src/domain/plan.ts";
import { activeProviders } from "../src/domain/settings.ts";
import type { AnalyticsProvider } from "../src/ports/AnalyticsProvider.ts";

const settle = () => new Promise((r) => setTimeout(r));
const page = ({ objects = false, saved = undefined as SavedChoice | undefined, broken = false } = {}) => {
  const log: string[] = [];
  let loads = 0, changed = () => {};
  const at = { now: 1000 };
  const provider: AnalyticsProvider = { start: () => { log.push("start"); }, track: (e) => { log.push(e.name); }, stop: () => { log.push("stop"); } };
  const bad: AnalyticsProvider = { start() { throw new Error(); }, track() { throw new Error(); }, stop() { throw new Error(); } };
  const analytics = createAnalytics({
    store: { read: () => saved, write: (c) => { saved = c; }, onChange: (l) => { changed = l; } },
    signal: { objects: () => objects },
    now: () => at.now,
    providers: async () => { loads++; return broken ? [bad, provider] : [provider]; },
  });
  analytics.start();
  return { analytics, log, at, loads: () => loads, otherTab: (c: SavedChoice) => { saved = c; changed(); } };
};
const open = { section: "quests", seconds: 3 };

test("nothing is loaded or sent before a yes", async () => {
  const p = page();
  p.analytics.track("section_read", open);
  await settle();
  assert.equal(p.analytics.status(), "unasked");
  assert.equal(p.loads(), 0);
  assert.deepEqual(p.log, []);
});
test("a yes starts the provider, then events flow", async () => {
  const p = page();
  p.analytics.choose("granted");
  p.analytics.track("section_read", open);
  await settle();
  assert.deepEqual(p.log, ["start", "section_read"]);
});
test("a no after a yes stops everything", async () => {
  const p = page();
  p.analytics.choose("granted"); await settle();
  p.analytics.choose("refused");
  p.analytics.track("section_read", open); await settle();
  assert.deepEqual(p.log, ["start", "stop"]);
});
test("a no while the provider loads: it never starts", async () => {
  const p = page();
  p.analytics.choose("granted"); p.analytics.choose("refused"); await settle();
  assert.deepEqual(p.log, []);
});
test("a no in another tab stops this one", async () => {
  const p = page();
  p.analytics.choose("granted"); await settle();
  p.otherTab({ choice: "refused", at: 1000, plan: PLAN_VERSION }); await settle();
  assert.deepEqual(p.log, ["start", "stop"]);
});
test("a browser that objects is not asked, unless the visitor says yes", () => {
  const p = page({ objects: true });
  assert.equal(p.analytics.status(), "refused");
  p.analytics.choose("granted");
  assert.equal(p.analytics.status(), "granted");
});
test("a choice expires, and a yes does not cover a newer plan", () => {
  assert.equal(page({ saved: { choice: "granted", at: 1000 - CHOICE_LASTS_MS, plan: PLAN_VERSION } }).analytics.status(), "unasked");
  assert.equal(page({ saved: { choice: "granted", at: 999, plan: PLAN_VERSION - 1 } }).analytics.status(), "unasked");
});
test("a broken provider does not stop the others", async () => {
  const p = page({ broken: true });
  p.analytics.choose("granted"); p.analytics.track("section_read", open); await settle();
  assert.deepEqual(p.log, ["start", "section_read"]);
});
test("events outside the plan are refused", () => {
  assert.equal(toEvent("constructor", {}), undefined);
  assert.equal(toEvent("section_read", { section: "a", seconds: 4, email: "x" }), undefined);
  assert.equal(toEvent("section_read", { section: "a b", seconds: 4 }), undefined);
  assert.equal(toEvent("section_read", { section: "a", seconds: 9999 }), undefined);
  assert.ok(toEvent("section_read", { section: "a", seconds: 4 }));
});
test("addresses are reduced to a kind of site and a path", () => {
  assert.equal(sourceOf("www.linkedin.com", "me.dev"), "linkedin");
  assert.equal(sourceOf("notgithub.com", "me.dev"), "other");
  assert.equal(sourceOf("www.google.fr", "me.dev"), "search");
  assert.deepEqual(destinationOf("www.npmjs.com", "/package/@a/b"), { destination: "npm", item: "package/@a/b" });
});
test("a provider runs when its setting is filled; one override turns all off", () => {
  const known = ["beacon", "events", "console"], s = { beacon: "", events: "https://c" };
  assert.deepEqual(activeProviders(s, known), { events: "https://c" });
  assert.deepEqual(activeProviders(s, known, "none"), {});
  assert.deepEqual(activeProviders(s, known, "console"), { console: "" });
  assert.throws(() => activeProviders({ typo: "x" }, known));
});
