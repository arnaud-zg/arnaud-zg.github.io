import assert from "node:assert/strict";
import test from "node:test";

import { DECK, deckOf, scaleOf } from "../src/input/domain/controls.ts";

const phones = [
  [390, 844],
  [360, 740],
  [430, 932],
  [820, 1180], // a tablet, upright
] as const;

test("on a phone held upright the controls sit under the stage, never over it", () => {
  for (const [w, h] of phones) {
    const d = deckOf(w, h, true);
    assert.equal(d.mode, "bottom", `${w}×${h}`);
    assert.equal(d.stage.y + d.stage.h + d.size, h, "the stage ends where the deck starts");
    assert.equal(d.stage.w, w);
    assert.ok(d.size >= DECK.bottom[0] && d.size <= DECK.bottom[1]);
    assert.ok(d.stage.h > h / 2, "the stage keeps the larger share");
  }
});

test("on a phone lying down the controls take a column either side of the stage", () => {
  for (const [h, w] of phones) {
    const d = deckOf(w, h, true);
    assert.equal(d.mode, "side", `${w}×${h}`);
    assert.equal(d.stage.x, d.size, "the stage starts after the left column");
    assert.equal(d.stage.x + d.stage.w + d.size, w, "and ends before the right one");
    assert.ok(d.size >= DECK.side[0] && d.size <= DECK.side[1]);
    assert.ok(d.size >= 2 * 62 + 12, "room for two buttons side by side");
  }
});

test("without touch there is no deck, the stage is the whole window", () => {
  assert.deepEqual(deckOf(1280, 800, false), {
    mode: "none",
    size: 0,
    stage: { x: 0, y: 0, w: 1280, h: 800 },
  });
});

test("the stage is scaled up as far as it fits, between 2 and 5", () => {
  assert.equal(scaleOf(1920, 1080), 5);
  assert.equal(scaleOf(900, 600), 3);
  assert.equal(scaleOf(200, 300), 2, "never below two, even on the smallest screen");
});
