import assert from "node:assert/strict";
import test from "node:test";

import { missingGlyphs } from "../src/arcade/adapters/pixel.font.ts";
import { FOES } from "../src/campaign/domain/levels/catalog/foes.ts";
import { MAPS } from "../src/campaign/domain/levels/index.ts";
import { crateSlots } from "../src/campaign/domain/map.ts";

// What a level says on screen, in the pixel font.
const wordsOf = (map: (typeof MAPS)[number]) => [
  map.title,
  map.time,
  map.warning,
  ...map.briefing,
  map.turret.name,
  map.boss.name,
  map.boss.split,
];

for (const map of MAPS) {
  test(`${map.id}: every word on screen can be drawn in the pixel font`, () => {
    for (const words of wordsOf(map)) assert.deepEqual(missingGlyphs(words), [], words);
  });

  test(`${map.id}: its events run in order and end on the boss, at the end of the map`, () => {
    const at = map.events.map((e) => e.at);
    assert.deepEqual(
      at,
      [...at].sort((a, b) => a - b),
    );
    assert.deepEqual(map.events.at(-1), { at: map.length, kind: "boss" });
  });

  test(`${map.id}: every foe it sends is in the catalog`, () => {
    for (const e of map.events) {
      const spawns = e.kind === "spawn" ? [e.spawn] : e.kind === "lock" ? e.wave : [];
      for (const s of spawns) assert.ok(s.foe in FOES, s.foe);
    }
  });

  test(`${map.id}: it holds a crate for each of a chapter's eleven skills`, () => {
    assert.equal(crateSlots(map), 11);
  });

  test(`${map.id}: its boss starts at full health in its first phase`, () => {
    assert.equal(map.boss.phases[0]?.below, 1);
  });
}

test("every line the reviewer says can be drawn in the pixel font", async () => {
  const { REVIEW } = await import("../src/campaign/domain/levels/catalog/review.ts");
  for (const lines of Object.values(REVIEW))
    for (const line of Object.values(lines)) assert.deepEqual(missingGlyphs(line), [], line);
});
