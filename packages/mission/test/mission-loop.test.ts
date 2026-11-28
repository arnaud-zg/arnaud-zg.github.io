import assert from "node:assert/strict";
import test from "node:test";

import { missingGlyphs } from "../src/arcade/adapters/pixel.font.ts";
import { SPAM } from "../src/campaign/domain/levels/catalog/incidents.ts";
import {
  LOOP_CONSOLES,
  LOOP_STAGES,
  TESTS_SKIPPED,
} from "../src/campaign/domain/levels/catalog/loops.ts";
import { MAPS } from "../src/campaign/domain/levels/index.ts";
import { faster, shotOf, skipTests, stageOf } from "../src/challenge/domain/loop.ts";

const at = (stage: number, skipped = false) =>
  stageOf({ loop: { stage, skipped }, stages: LOOP_STAGES, skipped: TESTS_SKIPPED });

test("each improvement of the loop makes the build shorter, down to hot reload", () => {
  const builds = LOOP_STAGES.map((s) => s.build);
  assert.deepEqual(
    builds,
    [...builds].sort((a, b) => b - a),
  );
  assert.equal(at(99).label, "HOT RELOAD", "past the last stage, it stays the fastest");
  assert.equal(at(faster({ stage: 0, skipped: false }).stage).label, LOOP_STAGES[1]?.label);
});

test("skipping the tests is instant, and ships bugs", () => {
  const skipped = at(0, skipTests({ stage: 0, skipped: false }).skipped);
  assert.ok(skipped.build < (LOOP_STAGES[0]?.build ?? 0));
  assert.equal(shotOf({ stage: skipped, roll: 0.1 }), "backfire");
  assert.equal(shotOf({ stage: skipped, roll: 0.9 }), "fire");
});

test("a slow build flakes now and then; a fast one never does", () => {
  assert.equal(shotOf({ stage: at(0), roll: 0.1 }), "flaky");
  assert.equal(shotOf({ stage: at(4), roll: 0.01 }), "fire");
});

test("the feedback loop has one console per improvement, each with a way to make it faster", () => {
  const consoles = Object.values(LOOP_CONSOLES);
  assert.equal(consoles.length, LOOP_STAGES.length - 1);
  for (const c of consoles)
    assert.ok(
      c.steps.every((s) => s.choices.some((choice) => choice.perk === "faster")),
      c.id,
    );
});

test("the loop zone and its consoles sit in one level, the incident and its kiosk in another", () => {
  const kinds = MAPS.map((m) => m.events.map((e) => e.kind));
  assert.equal(kinds.filter((k) => k.includes("loop")).length, 1);
  assert.equal(kinds.filter((k) => k.includes("incident")).length, 1);
});

test("everything the loop and the console say can be drawn", () => {
  for (const line of [...SPAM, ...LOOP_STAGES.map((s) => `${s.label} · ${s.eta}`)])
    assert.deepEqual(missingGlyphs(line), [], line);
});
