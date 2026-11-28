import assert from "node:assert/strict";
import test from "node:test";

import type { CodeKey } from "../src/input/domain/code.ts";
import { pickupsOf } from "../src/campaign/domain/loadout.ts";
import { pushCode, swipeOf } from "../src/input/domain/code.ts";

const enter = (keys: CodeKey[]) => {
  let history: CodeKey[] = [];
  let done = false;
  for (const key of keys) ({ history, done } = pushCode(history, key));
  return done;
};
const arrows: CodeKey[] = ["up", "up", "down", "down", "left", "right", "left", "right"];

test("the Konami code starts the mission, typed or swiped and tapped", () => {
  assert.equal(enter([...arrows, "b", "a"]), true);
  assert.equal(enter([...arrows, "tap", "tap"]), true);
});

test("a slip before the code does not stop it, but a wrong key inside it does", () => {
  assert.equal(enter(["up", "left", "up", ...arrows, "b", "a"]), true);
  assert.equal(
    enter(["up", "up", "down", "left", "left", "right", "left", "right", "b", "a"]),
    false,
  );
  assert.equal(enter([...arrows, "a", "b"]), false);
});

test("a short touch taps, a longer one swipes the way it went most", () => {
  assert.equal(swipeOf(5, -8), "tap");
  assert.equal(swipeOf(10, -80), "up");
  assert.equal(swipeOf(-60, 20), "left");
});

test("crates hold the stack used longest first, then most recent, with where and when", () => {
  const pickups = pickupsOf(
    [
      { name: "Intern", start: "2013-07", end: "2013-12", stack: "PHP" },
      { name: "Intern 2", start: "2014-09", end: "2015-02", stack: "PHP" },
      { name: "Early", start: "2017-03", end: "2019-05", stack: "React, SSR" },
      {
        name: "Mobile",
        start: "2019-06",
        end: "2020-01",
        stack: "React Native, TypeScript",
        emoji: "🚗",
      },
      { name: "Now", start: "2026-01", stack: "Monorepos, TypeScript", emoji: "🩺" },
    ],
    10,
    new Date("2026-11-27"),
  );
  // Two short internships do not outrank years in one place.
  assert.deepEqual(
    pickups.map((p) => p.name),
    ["React", "SSR", "TypeScript", "PHP", "Monorepos", "React Native"],
  );
  assert.deepEqual(pickups[2], {
    name: "TypeScript",
    places: ["Mobile", "Now"],
    marks: ["🚗", "🩺"], // the journey's emoji, one per place
    from: 2019,
    to: null,
  });
  assert.deepEqual(pickups[5], {
    name: "React Native",
    places: ["Mobile"],
    marks: ["🚗"],
    from: 2019,
    to: 2020,
  });
  assert.equal(pickupsOf([{ name: "A", start: "2020-01", stack: "Go, Rust, Zig" }], 2).length, 2);
});
