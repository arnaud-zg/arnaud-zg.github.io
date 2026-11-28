import assert from "node:assert/strict";
import test from "node:test";

import { Combos, MOVES } from "../src/moves/domain/combos.ts";
import {
  HITSTOP,
  JUMP,
  Jumper,
  MAGNET,
  pullToward,
  sideOf,
  stopFor,
} from "../src/moves/domain/motion.ts";

const standing = () => {
  const j = new Jumper();
  j.ground(true, 0);
  return j;
};

test("a jump pressed on the ground jumps, once", () => {
  const j = standing();
  j.press(1);
  assert.equal(j.take(1, true), true);
  j.ground(false, 1.01);
  assert.equal(j.take(1.02, false), false, "no second jump in the air");
});

test("a jump pressed just after walking off a ledge still jumps", () => {
  const j = standing();
  j.ground(false, 2);
  j.press(2 + JUMP.coyote - 0.01);
  assert.equal(j.take(2 + JUMP.coyote - 0.01, false), true);
  const late = standing();
  late.ground(false, 2);
  late.press(2 + JUMP.coyote + 0.05);
  assert.equal(late.take(2 + JUMP.coyote + 0.05, false), false, "too late: falling");
});

test("a jump pressed just before landing jumps on landing; pressed too early, it does not", () => {
  const j = new Jumper();
  j.ground(false, 0);
  j.press(3);
  assert.equal(j.take(3, false), false, "still in the air");
  j.ground(true, 3 + JUMP.buffer - 0.02);
  assert.equal(j.take(3 + JUMP.buffer - 0.02, true), true);
  const early = new Jumper();
  early.press(3);
  early.ground(true, 3 + JUMP.buffer + 0.1);
  assert.equal(early.take(3 + JUMP.buffer + 0.1, true), false);
});

test("letting go of jump on the way up makes a short hop; at the top, nothing changes", () => {
  const j = standing();
  j.press(0);
  j.take(0, true);
  assert.equal(j.release(-JUMP.speed), -JUMP.speed * JUMP.cut);
  assert.equal(j.release(-JUMP.speed), -JUMP.speed, "only the first release cuts");
  const top = standing();
  top.press(0);
  top.take(0, true);
  assert.equal(top.release(-10), -10, "already slow: kept");
  assert.equal(top.release(40), 40);
  const dropped = standing();
  dropped.fall();
  assert.equal(dropped.release(-JUMP.speed), -JUMP.speed, "a drop through a ledge is not cut");
});

test("a pickup drifts to a hero close by, never past them, and stays put further off", () => {
  assert.ok(pullToward(100, 110, 0.05) > 100);
  assert.equal(pullToward(100, 101, 1), 101, "it stops at the hero");
  assert.equal(pullToward(100, 100 + MAGNET.reach + 1, 0.05), 100);
  assert.ok(pullToward(100, 90, 0.05) < 100, "from either side");
});

test("heavy blows freeze the world a moment, never long", () => {
  assert.equal(stopFor(0, HITSTOP.kill), HITSTOP.kill);
  assert.equal(stopFor(HITSTOP.heavy, HITSTOP.kill), HITSTOP.heavy, "blows do not stack");
  assert.equal(stopFor(0, 5), HITSTOP.max);
});

test("guard, back and jump roll out of harm's way, cheaper than any attack", () => {
  const c = new Combos();
  c.press("guard", 0);
  c.press("back", 0.1);
  assert.equal(c.press("jump", 0.2)?.id, "rollback");
  const roll = MOVES.find((m) => m.id === "rollback");
  assert.ok(roll && MOVES.every((m) => m === roll || m.cost > roll.cost));
  assert.equal(new Set(MOVES.map((m) => m.keys.join())).size, MOVES.length, "no two alike");
});

test("a step left faces left, anything else faces right", () => {
  assert.equal(sideOf(-3), -1);
  assert.equal(sideOf(2), 1);
  assert.equal(sideOf(0), 1);
});
