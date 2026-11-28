import assert from "node:assert/strict";
import test from "node:test";

import { missingGlyphs } from "../src/arcade/adapters/pixel.font.ts";
import { missionDataOf } from "../src/arcade/adapters/zod.data.ts";
import { COLLEAGUES } from "../src/campaign/domain/levels/catalog/colleagues.ts";
import { EXERCISES } from "../src/campaign/domain/levels/catalog/exercises.ts";
import { ROSTERS } from "../src/campaign/domain/levels/catalog/foes.ts";
import { MAPS } from "../src/campaign/domain/levels/index.ts";

test("light mode and dark mode dress every kind of foe differently, with the same kinds", () => {
  assert.deepEqual(Object.keys(ROSTERS.light).sort(), Object.keys(ROSTERS.dark).sort());
  for (const kind of ["bug", "robot", "drone"] as const)
    assert.notEqual(ROSTERS.light[kind].look, ROSTERS.dark[kind].look, kind);
});

test("every colleague's words and every foe's name can be drawn", () => {
  const words = [
    ...Object.values(COLLEAGUES).flatMap((c) => [
      c.name,
      c.arrive,
      c.inDebt,
      c.leave,
      ...("nits" in c ? c.nits : []),
    ]),
    ...Object.values(ROSTERS).flatMap((roster) => Object.values(roster).map((skin) => skin.name)),
  ];
  for (const w of words) assert.deepEqual(missingGlyphs(w.replace("{context}", "IT")), [], w);
});

test("a colleague who reviews points at a real review, and every level meets two colleagues", () => {
  for (const c of Object.values(COLLEAGUES))
    if ("review" in c) assert.ok(c.review in EXERCISES, c.name);
  for (const map of MAPS)
    assert.equal(map.events.filter((e) => e.kind === "colleague").length, 2, map.id);
});

test("the site says where its theme lives; anything else is refused", () => {
  const data = missionDataOf(
    JSON.stringify({
      chapters: [],
      labels: {},
      theme: { attribute: "theme", storageKey: "theme" },
    }),
  );
  assert.deepEqual(data?.theme, { attribute: "theme", storageKey: "theme" });
  assert.equal(
    missionDataOf(JSON.stringify({ chapters: [], labels: {}, theme: { attribute: 1 } })),
    undefined,
  );
});
