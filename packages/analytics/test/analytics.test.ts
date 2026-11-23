import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalytics } from "../src/application/analytics.ts";
import { CHOICE_LASTS_MS, type SavedChoice } from "../src/domain/consent.ts";
import { destinationOf, PLAN_VERSION, sourceOf, toEvent } from "../src/domain/plan.ts";
import { posthog } from "../src/adapters/posthog.provider.ts";
import { settingsFor } from "../src/domain/settings.ts";
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
    provider: async () => { loads++; return broken ? bad : provider; },
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
test("a provider that fails never breaks the page", async () => {
  const p = page({ broken: true });
  p.analytics.choose("granted"); p.analytics.track("section_read", open); await settle();
  p.analytics.choose("refused"); await settle();
  assert.equal(p.analytics.status(), "refused");
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
const config = { posthogKey: "phc_abc", posthogRegion: "eu" };
const host = "me.dev";
test("development is mocked, a build uses PostHog when its key is filled", () => {
  const real = { provider: "posthog", key: "phc_abc", region: "eu", host };
  assert.deepEqual(settingsFor(config, { dev: true, host }), { provider: "mock" });
  assert.deepEqual(settingsFor({ ...config, posthogKey: "" }, { dev: true, host }), { provider: "mock" });
  assert.deepEqual(settingsFor(config, { dev: false, host }), real);
  assert.equal(settingsFor({ ...config, posthogKey: "" }, { dev: false, host }), undefined);
  assert.deepEqual(settingsFor(config, { dev: true, host, mode: "on" }), real);
  assert.equal(settingsFor(config, { dev: true, host, mode: "off" }), undefined);
  assert.equal(settingsFor(config, { dev: false, host, mode: "off" }), undefined);
});
test("a wrong setting stops the build and says what to write", () => {
  const run = { dev: false, host };
  assert.throws(() => settingsFor({ ...config, posthogKey: "phx_abc" }, run), /personal key.*phc_/);
  assert.throws(() => settingsFor({ ...config, posthogKey: "abc" }, run), /starts with phc_/);
  assert.throws(() => settingsFor({ ...config, posthogRegion: "fr" }, run), /"eu" or "us"/);
  assert.throws(() => settingsFor(config, { ...run, mode: "yes" }), /"on" or "off"/);
  assert.throws(() => settingsFor({ ...config, posthogKey: "" }, { ...run, mode: "on" }), /needs posthogKey/);
});
for (const region of ["eu", "us"] as const) test(`PostHog ${region} gets the event, with no profile and no location`, async (t) => {
  const calls: [string, RequestInit][] = [];
  t.mock.method(globalThis, "fetch", (url: string, init: RequestInit) => { calls.push([url, init]); return Promise.reject(new Error("offline")); });
  (globalThis as { location?: unknown }).location = { pathname: "/" };
  const p = posthog({ key: "phc_abc", region, environment: "local" });
  p.track({ name: "section_read", props: open });
  p.track({ name: "section_read", props: open });
  await settle();
  const [url, init] = calls[0];
  const body = JSON.parse(init.body as string);
  assert.equal(url, `https://${region}.i.posthog.com/i/v0/e/`);
  assert.equal(init.credentials, "omit");
  assert.deepEqual(body, { api_key: "phc_abc", event: "section_read", distinct_id: body.distinct_id, properties: { ...open, path: "/", environment: "local", $process_person_profile: false, $geoip_disable: true } });
  assert.equal(JSON.parse(calls[1][1].body as string).distinct_id, body.distinct_id);
});
