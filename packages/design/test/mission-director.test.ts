import assert from "node:assert/strict";
import test from "node:test";

import {
  afterDeath,
  floorOf,
  HEAT,
  heatToward,
  levelOf,
  mercyOf,
  nextAttack,
  spotOf,
  Spots,
  toughen,
  Tracker,
  tuningOf,
} from "../src/mission/rules.ts";

// Plays `seconds` of a player who, each second, fires `shots`, lands `hits`, kills `kills`, and
// dies once every `dieEvery` seconds, the way the game does: each death in the same spot counts
// towards the help it gives. Returns what the game settles on.
const play = (
  p: { shots: number; hits: number; kills: number; dieEvery?: number },
  seconds = 240,
) => {
  const t = new Tracker();
  const spots = new Spots();
  let heat: number = HEAT.start;
  let calmed = 0;
  for (let s = 1; s <= seconds; s++) {
    t.observe("shot", p.shots);
    t.observe("hit", p.hits);
    t.observe("kill", p.kills);
    if (p.dieEvery && s % p.dieEvery === 0) {
      t.observe("death");
      heat = afterDeath(heat, floorOf(0, 0));
      if (mercyOf(spots.die(spotOf(1, 0))).calm) {
        heat = floorOf(0, 0);
        calmed++;
      }
    }
    t.tick(1);
    heat = heatToward(heat, t.skill(), floorOf(0, 0), 1);
  }
  return { heat, tune: tuningOf(heat), calmed };
};

const novice = () => play({ shots: 2, hits: 0.6, kills: 0.1, dieEvery: 25 });
const regular = () => play({ shots: 3, hits: 1.5, kills: 0.3 });
const expert = () => play({ shots: 3, hits: 2.4, kills: 0.8 });

test("players of three skills each meet a game shaped to them", () => {
  const [n, r, e] = [novice(), regular(), expert()];
  assert.ok(n.heat < r.heat && r.heat < e.heat, `${n.heat} < ${r.heat} < ${e.heat}`);
  // A struggling player faces one gun at a time, sloppy aim and foes that fold sooner.
  assert.equal(n.tune.shooters, 1);
  assert.ok(n.tune.jitter > 0.1);
  assert.equal(toughen(3, n.tune.tough), 2);
  assert.equal(n.tune.repeat, false, "and a boss that never repeats itself");
  // A sure hand faces a crossfire, true aim, tougher foes and a boss that can repeat.
  assert.ok(e.tune.shooters >= 3);
  assert.equal(e.tune.jitter, 0);
  assert.ok(toughen(3, e.tune.tough) >= 4);
  assert.equal(e.tune.repeat, true);
  // In between, in between.
  assert.ok(r.tune.shooters > n.tune.shooters && r.tune.shooters < e.tune.shooters);
});

test("every knob turns the same way: more heat is never easier", () => {
  let before = tuningOf(HEAT.floor);
  for (let h = HEAT.floor + 0.05; h <= HEAT.max + 1e-9; h += 0.05) {
    const now = tuningOf(h);
    assert.ok(now.fire >= before.fire && now.bullet >= before.bullet, `fire at ${h}`);
    assert.ok(now.warn <= before.warn, `warn at ${h}`);
    assert.ok(now.shooters >= before.shooters && now.tough >= before.tough, `foes at ${h}`);
    assert.ok(now.boss >= before.boss && now.rest <= before.rest, `boss at ${h}`);
    assert.ok(now.jitter <= before.jitter && now.pace <= before.pace, `aim and pace at ${h}`);
    before = now;
  }
});

test("even at its hardest the game stays fair: time to react, a few guns, a boss in reach", () => {
  const top = tuningOf(HEAT.max);
  assert.ok(top.warn >= 0.36, "a warning longer than a reflex");
  assert.ok(top.shooters <= 4);
  assert.ok(top.boss <= 1.2);
  const low = tuningOf(HEAT.floor);
  assert.ok(low.boss >= 0.85, "and an easy boss still takes a fight");
  assert.equal(levelOf(0), 0);
  assert.equal(levelOf(9), 1);
});

test("stuck in one spot, the game helps more each time, and only there", () => {
  const spots = new Spots();
  const here = spotOf(3, 900);
  const first = mercyOf(spots.die(here));
  assert.deepEqual([first.supply, first.calm], [false, false], "one death is part of the game");
  const second = mercyOf(spots.die(here));
  assert.deepEqual([second.supply, second.calm], [true, false], "a second brings a supply drop");
  const third = mercyOf(spots.die(here));
  assert.deepEqual([third.supply, third.calm], [true, true], "a third calms the game down");
  assert.ok(third.safe > second.safe && second.safe > first.safe, "and a longer safe return");
  assert.equal(mercyOf(spots.die(spotOf(4, 900))).supply, false, "a new spot starts afresh");
  assert.equal(spotOf(undefined, 100), spotOf(undefined, 200), "open ground counts by stretch");
  assert.notEqual(spotOf(undefined, 100), spotOf(undefined, 500));
});

test("a player who keeps dying in the same lock is calmed down to the floor", () => {
  const n = novice();
  assert.ok(n.calmed > 0);
  assert.ok(Math.abs(n.heat - floorOf(0, 0)) < 0.1);
});

test("at ease the boss never repeats an attack; on the edge it may", () => {
  const attacks = ["hop", "volley", "sweepLow"] as const;
  for (let roll = 0; roll < 1; roll += 0.01)
    assert.notEqual(nextAttack(attacks, "volley", false, roll), "volley");
  const seen = new Set<string | undefined>();
  for (let roll = 0; roll < 1; roll += 0.01) seen.add(nextAttack(attacks, "volley", true, roll));
  assert.equal(seen.size, 3);
  assert.equal(nextAttack(["spawn"] as const, "spawn", false, 0.5), "spawn", "one attack, used");
  assert.equal(nextAttack(attacks, undefined, false, 0.999), "sweepLow");
});

test("a wave's foes come further apart for a player at ease", () => {
  assert.ok(tuningOf(HEAT.floor).pace > 1);
  assert.ok(tuningOf(HEAT.max).pace < 1);
});
