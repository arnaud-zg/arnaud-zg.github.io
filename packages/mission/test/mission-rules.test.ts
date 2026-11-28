import assert from "node:assert/strict";
import test from "node:test";

import { MAPS, MOMENTS, ODDS } from "../src/campaign/domain/levels/index.ts";
import { orderMaps, pickMap } from "../src/campaign/domain/map.ts";
import { chainAfter, multiplierOf, rankOf } from "../src/combat/domain/score.ts";
import { weaponOf, WEAPONS } from "../src/combat/domain/weapons.ts";
import {
  afterDeath,
  floorOf,
  HEAT,
  heatToward,
  Tracker,
  tuningOf,
} from "../src/director/domain/director.ts";

test("each crate hands out the map's next weapon, round and round", () => {
  const loot = ["rapid", "spread", "flame"] as const;
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => weaponOf(loot, i)),
    ["rapid", "spread", "flame", "rapid"],
  );
  assert.equal(WEAPONS.pistol.ammo, Infinity);
});

// Plays `seconds` of a player who, each second, fires `shots`, lands `hits`, kills `kills`, and
// dies once every `dieEvery` seconds; returns the heat the game settles on.
const settle = (
  p: { shots: number; hits: number; kills: number; dieEvery?: number },
  seconds = 180,
) => {
  const t = new Tracker();
  let heat: number = HEAT.start;
  for (let s = 1; s <= seconds; s++) {
    t.observe("shot", p.shots);
    t.observe("hit", p.hits);
    t.observe("kill", p.kills);
    if (p.dieEvery && s % p.dieEvery === 0) {
      t.observe("death");
      heat = afterDeath(heat, floorOf(0, 0));
    }
    t.tick(1);
    heat = heatToward(heat, t.skill(), floorOf(0, 0), 1);
  }
  return { heat, skill: t.skill() };
};

test("the difficulty settles a little above what the player shows", () => {
  const sharp = settle({ shots: 3, hits: 2, kills: 0.5 });
  const sloppy = settle({ shots: 3, hits: 0.5, kills: 0.1, dieEvery: 20 });
  assert.ok(sharp.heat > HEAT.start, "a sure hand makes it harder");
  assert.ok(sloppy.heat < sharp.heat, "a struggling player gets an easier game");
  assert.ok(
    Math.abs(sharp.heat - Math.min(HEAT.max, sharp.skill + HEAT.margin)) < 0.05,
    "just a bit above the player",
  );
  assert.ok(sloppy.heat >= floorOf(0, 0), "never below the floor");
  assert.ok(floorOf(2, 5) > floorOf(0, 0), "and the floor keeps rising");
  assert.ok(tuningOf(1.5).bullet > tuningOf(0.8).bullet);
});

test("it eases towards the target rather than jumping", () => {
  const next = heatToward(1, 2, 0.7, 1);
  assert.ok(next > 1 && next < 1.2);
});

test("quick kills build a chain that multiplies the score, up to eight", () => {
  assert.equal(chainAfter(3, 1), 4);
  assert.equal(chainAfter(3, 2.5), 1);
  assert.equal(multiplierOf(1), 1);
  assert.equal(multiplierOf(12), 8);
});

test("the rank is hard to earn: one credit, the skills and a sure hand", () => {
  const run = { cleared: true, continues: 0, deaths: 1, skills: 11, total: 11, accuracy: 0.5 };
  assert.equal(rankOf(run), "S");
  assert.equal(rankOf({ ...run, accuracy: 0.3 }), "A");
  assert.equal(rankOf({ ...run, deaths: 3 }), "B");
  assert.equal(rankOf({ ...run, continues: 1 }), "C");
  assert.equal(rankOf({ ...run, cleared: false }), "-");
});

const at = (h: number, m: number, day = 28) =>
  pickMap(MAPS, ODDS, MOMENTS, new Date(2026, 10, day, h, m));

test("a nerd's minute always brings its map, and says why", () => {
  assert.equal(at(13, 37).map.rarity, "rare");
  assert.equal(at(13, 37).note, "13:37 · LEET O'CLOCK");
  assert.equal(at(9, 42).map.rarity, "special");
  assert.equal(at(3, 14).map.rarity, "special");
});

test("other minutes draw the rarity at its odds, the same for everyone in that minute", () => {
  assert.equal(at(10, 5).map.id, at(10, 5).map.id);
  const counts = { common: 0, special: 0, rare: 0 };
  for (let day = 1; day <= 28; day++)
    for (let m = 0; m < 24 * 60; m++) {
      const pick = at(Math.floor(m / 60), m % 60, day);
      if (!pick.note) counts[pick.map.rarity]++;
    }
  const total = counts.common + counts.special + counts.rare;
  for (const r of ["common", "special", "rare"] as const)
    assert.ok(Math.abs(counts[r] / total - ODDS[r]) < 0.01, `${r}: ${counts[r] / total}`);
});

test("each map has its own rarity", () => {
  assert.deepEqual(MAPS.map((m) => m.rarity).sort(), ["common", "rare", "special"]);
});

test("the shared words list every operation played, with its rank or how it ended", async () => {
  const { fill } = await import("../src/arcade/adapters/web.share.ts");
  const { missionLabels } = await import("../src/arcade/domain/labels.ts");
  const run = {
    played: [
      { title: "OPERATION: DEEP DIVE", rank: "A" },
      { title: "OPERATION: SHIP IT", rank: "-" },
    ],
    score: 129700,
    skills: 9,
    total: 22,
  };
  assert.equal(
    fill(missionLabels.shareText, missionLabels, run, "https://example.dev/"),
    "I found the secret mission hidden in example.dev. Played OPERATION: DEEP DIVE (rank A), OPERATION: SHIP IT (game over): 129,700 points, 9 of 22 skills unlocked. Think you can beat it? https://example.dev/",
  );
});

test("the campaign plays every map once, the clock's pick first, the rare one most often last", () => {
  let rareLast = 0,
    runs = 0;
  for (let m = 0; m < 24 * 60; m += 7) {
    const date = new Date(2026, 10, 28, Math.floor(m / 60), m % 60);
    const order = orderMaps(MAPS, ODDS, MOMENTS, date);
    assert.equal(new Set(order).size, MAPS.length);
    assert.equal(order[0], pickMap(MAPS, ODDS, MOMENTS, date).map);
    if (order[0]?.rarity !== "rare") {
      runs++;
      if (order.at(-1)?.rarity === "rare") rareLast++;
    }
  }
  assert.ok(rareLast / runs > 0.7, `rare last in ${rareLast}/${runs}`);
});

test("every skill of the site's stack has a fun fact to tell", async () => {
  const { loreOf } = await import("../src/campaign/domain/levels/catalog/lore.ts");
  for (const s of ["TypeScript", "React Native", "Node.js", "Module Federation", "CQRS"])
    assert.ok(loreOf(s), s);
  assert.equal(loreOf("Cobol"), undefined);
});

test("guard, a direction and an action, quickly, trigger a special move; slowly, nothing", async () => {
  const { Combos, inputOf } = await import("../src/moves/domain/combos.ts");
  const c = new Combos();
  assert.equal(c.press("guard", 0), undefined);
  assert.equal(c.press("forward", 0.1), undefined);
  assert.equal(c.press("fire", 0.2)?.id, "dash");
  const slow = new Combos();
  slow.press("guard", 0);
  slow.press("down", 0.5);
  assert.equal(slow.press("fire", 1.2), undefined, "too slow");
  const quick = new Combos();
  quick.press("guard", 0);
  quick.press("up", 0.1);
  assert.equal(quick.press("bomb", 0.2)?.id, "strike");
  assert.equal(inputOf("left", -1), "forward", "directions count from where the hero faces");
  assert.equal(inputOf("left", 1), "back");
  assert.equal(inputOf("pause", 1), undefined);
});

test("the action keys sit side by side, in the same place on QWERTY and AZERTY", async () => {
  const { keyOf } = await import("../src/input/domain/controls.ts");
  assert.deepEqual(["s", "d", "f", " ", "p"].map(keyOf), [
    "fire",
    "bomb",
    "guard",
    "jump",
    "pause",
  ]);
  assert.equal(keyOf("S"), "fire");
  assert.equal(keyOf("q"), undefined, "nothing on the letters that move between layouts");
});
