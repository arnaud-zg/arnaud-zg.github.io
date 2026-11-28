import assert from "node:assert/strict";
import test from "node:test";

import { missingGlyphs } from "../src/arcade/adapters/pixel.font.ts";
import { binary, HAPTICS, morse } from "../src/campaign/domain/levels/catalog/haptics.ts";
import { PROPS } from "../src/campaign/domain/levels/catalog/items.ts";
import { MAPS } from "../src/campaign/domain/levels/index.ts";
import { Combos } from "../src/moves/domain/combos.ts";

test("the phone buzzes OK in Morse: dash dash dash, then dash dot dash", () => {
  assert.deepEqual(morse("OK"), [150, 50, 150, 50, 150, 150, 150, 50, 50, 50, 150]);
});

test("a combo's chain buzzes in binary, long for 1 and short for 0", () => {
  assert.deepEqual(binary(5), [120, 60, 40, 60, 120]);
});

test("every buzz is a pattern a phone accepts: whole milliseconds, under five seconds in all", () => {
  const patterns = Object.values(HAPTICS).map((p) => (typeof p === "function" ? p(8) : p));
  for (const pattern of patterns) {
    assert.ok(
      pattern.every((ms) => Number.isInteger(ms) && ms > 0),
      String(pattern),
    );
    assert.ok(pattern.reduce((sum, ms) => sum + ms, 0) < 5000);
  }
});

test("git push --force and git revert trigger, and the old moves still do", () => {
  const press = (keys: readonly ("guard" | "forward" | "down" | "up" | "fire")[]) => {
    const combos = new Combos();
    return keys.map((k, i) => combos.press(k, i * 0.1)).at(-1)?.id;
  };
  assert.equal(press(["guard", "forward", "forward", "fire"]), "force");
  assert.equal(press(["guard", "down", "up", "fire"]), "revert");
  assert.equal(press(["guard", "forward", "fire"]), "dash");
  assert.equal(press(["guard", "down", "fire"]), "blast");
});

test("every item can be named and used in the pixel font, and each level has some lying around", () => {
  for (const prop of Object.values(PROPS))
    assert.deepEqual([...missingGlyphs(prop.name), ...missingGlyphs(prop.used)], []);
  for (const map of MAPS)
    assert.ok(
      map.events.some((e) => e.kind === "prop"),
      map.id,
    );
});
