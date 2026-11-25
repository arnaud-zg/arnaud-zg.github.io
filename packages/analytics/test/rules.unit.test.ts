import assert from "node:assert/strict";
import { test } from "node:test";

import { destinationOf, sourceOf, toEvent } from "../src/domain/plan.ts";
import { settingsFor } from "../src/domain/settings.ts";

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
  assert.deepEqual(destinationOf("www.npmjs.com", "/package/@a/b"), {
    destination: "npm",
    item: "package/@a/b",
  });
});
const config = { posthogKey: "phc_abc", posthogRegion: "eu" };
const host = "me.dev";
test("development is mocked, a build uses PostHog when its key is filled", () => {
  const real = { provider: "posthog", key: "phc_abc", region: "eu", host };
  assert.deepEqual(settingsFor(config, { dev: true, host }), { provider: "mock" });
  assert.deepEqual(settingsFor({ ...config, posthogKey: "" }, { dev: true, host }), {
    provider: "mock",
  });
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
  assert.throws(
    () => settingsFor({ ...config, posthogKey: "" }, { ...run, mode: "on" }),
    /needs POSTHOG_KEY/,
  );
});
