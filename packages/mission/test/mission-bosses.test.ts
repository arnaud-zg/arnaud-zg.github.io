import assert from "node:assert/strict";
import test from "node:test";

import { MAPS } from "../src/campaign/domain/levels/index.ts";
import { gcBlow, healthOf, litSeam, prunable, seamBlow } from "../src/combat/domain/bosses.ts";

test("the monolith is extracted least coupled first, and a blow off the seam barely dents it", () => {
  assert.equal(litSeam([0, 0, 20, 30]), 2);
  assert.equal(litSeam([0, 0, 0, 0]), -1);
  assert.equal(seamBlow({ lit: 1, row: 1, damage: 10 }), 10);
  assert.equal(seamBlow({ lit: 1, row: 3, damage: 10 }), 1);
});

test("a package goes only once nothing imports it: leaves first, the root last", () => {
  const packages = [
    { name: "APP", health: 1 },
    { name: "UTILS", parent: "APP", health: 1 },
    { name: "LODASH", parent: "UTILS", health: 1 },
  ];
  const alive = new Set(["APP", "UTILS", "LODASH"]);
  assert.equal(prunable({ packages, alive, name: "APP" }), false);
  assert.equal(prunable({ packages, alive, name: "LODASH" }), true);
  alive.delete("LODASH");
  assert.equal(prunable({ packages, alive, name: "UTILS" }), true);
});

test("a leak shrugs off blows while referenced; unreferenced, a sweep hits hardest", () => {
  const spec = { referenced: 0.2, sweep: 3 };
  assert.equal(gcBlow({ damage: 10, referenced: true, blast: true, spec }), 2);
  assert.equal(gcBlow({ damage: 10, referenced: false, blast: false, spec }), 10);
  assert.equal(gcBlow({ damage: 10, referenced: false, blast: true, spec }), 30);
});

test("every boss has its mechanic, and its health is its parts' health", () => {
  for (const map of MAPS) {
    const { mechanic, hp } = map.boss;
    const parts = healthOf(mechanic);
    if (mechanic.kind !== "gc") assert.equal(parts, hp, map.id);
  }
  assert.deepEqual(MAPS.map((m) => m.boss.mechanic.kind).sort(), ["gc", "prune", "strangler"]);
});
