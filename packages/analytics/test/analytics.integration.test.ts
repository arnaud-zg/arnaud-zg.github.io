import assert from "node:assert/strict";
import { test } from "node:test";

import type { SavedChoice } from "../src/domain/consent.ts";
import { memoryConsent } from "../src/adapters/memory.consent.ts";
import { memoryProvider } from "../src/adapters/memory.provider.ts";
import { memorySignal } from "../src/adapters/memory.signal.ts";
import { posthog } from "../src/adapters/posthog.provider.ts";
import { createAnalytics } from "../src/application/analytics.ts";
import { CHOICE_LASTS_MS } from "../src/domain/consent.ts";
import { PLAN_VERSION } from "../src/domain/plan.ts";

const settle = () => new Promise((r) => setTimeout(r));
const fail = () => {
  throw new Error();
};
const page = ({
  objects = false,
  saved = undefined as SavedChoice | undefined,
  broken = false,
} = {}) => {
  const store = memoryConsent(saved);
  const provider = memoryProvider();
  let loads = 0;
  const analytics = createAnalytics({
    store,
    signal: memorySignal(objects),
    now: () => 1000,
    provider: () => {
      loads++;
      return Promise.resolve(broken ? { start: fail, track: fail, stop: fail } : provider);
    },
  });
  analytics.start();
  return {
    analytics,
    log: provider.log,
    loads: () => loads,
    otherTab: (choice: SavedChoice) => store.changeElsewhere(choice),
  };
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
  p.analytics.choose("granted");
  await settle();
  p.analytics.choose("refused");
  p.analytics.track("section_read", open);
  await settle();
  assert.deepEqual(p.log, ["start", "stop"]);
});
test("a no while the provider loads: it never starts", async () => {
  const p = page();
  p.analytics.choose("granted");
  p.analytics.choose("refused");
  await settle();
  assert.deepEqual(p.log, []);
});
test("a no in another tab stops this one", async () => {
  const p = page();
  p.analytics.choose("granted");
  await settle();
  p.otherTab({ choice: "refused", at: 1000, plan: PLAN_VERSION });
  await settle();
  assert.deepEqual(p.log, ["start", "stop"]);
});
test("a browser that objects is not asked, unless the visitor says yes", () => {
  const p = page({ objects: true });
  assert.equal(p.analytics.status(), "refused");
  p.analytics.choose("granted");
  assert.equal(p.analytics.status(), "granted");
});
test("a choice expires, and a yes does not cover a newer plan", () => {
  assert.equal(
    page({
      saved: { choice: "granted", at: 1000 - CHOICE_LASTS_MS, plan: PLAN_VERSION },
    }).analytics.status(),
    "unasked",
  );
  assert.equal(
    page({ saved: { choice: "granted", at: 999, plan: PLAN_VERSION - 1 } }).analytics.status(),
    "unasked",
  );
});
test("a provider that fails never breaks the page", async () => {
  const p = page({ broken: true });
  p.analytics.choose("granted");
  p.analytics.track("section_read", open);
  await settle();
  p.analytics.choose("refused");
  await settle();
  assert.equal(p.analytics.status(), "refused");
});
for (const region of ["eu", "us"] as const)
  test(`PostHog ${region} gets the event, with no profile and no location`, async (t) => {
    const calls: [string, RequestInit][] = [];
    t.mock.method(globalThis, "fetch", (url: string, init: RequestInit) => {
      calls.push([url, init]);
      return Promise.reject(new Error("offline"));
    });
    (globalThis as { location?: unknown }).location = { pathname: "/" };
    const p = posthog({ key: "phc_abc", region, environment: "local" });
    p.track({ name: "section_read", props: open });
    p.track({ name: "section_read", props: open });
    await settle();
    const [url, init] = calls[0];
    const body = JSON.parse(init.body as string);
    assert.equal(url, `https://${region}.i.posthog.com/i/v0/e/`);
    assert.equal(init.credentials, "omit");
    assert.deepEqual(body, {
      api_key: "phc_abc",
      event: "section_read",
      distinct_id: body.distinct_id,
      properties: {
        ...open,
        path: "/",
        environment: "local",
        $process_person_profile: false,
        $geoip_disable: true,
      },
    });
    assert.equal(JSON.parse(calls[1][1].body as string).distinct_id, body.distinct_id);
  });
