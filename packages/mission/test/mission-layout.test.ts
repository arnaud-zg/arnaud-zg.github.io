import assert from "node:assert/strict";
import test from "node:test";

import {
  clipLine,
  column,
  fitText,
  linesOf,
  pagesOf,
  widthOf,
  zonesOf,
} from "../src/arcade/domain/layout.ts";
import { deckOf, playable, scaleOf } from "../src/input/domain/controls.ts";

// Screens as visitors hold them: phones with and without the browser's bars, a tablet, desktops.
const SCREENS = [
  { name: "galaxy s24", width: 360, height: 780, touch: true },
  { name: "galaxy s24, bars", width: 360, height: 670, touch: true },
  { name: "galaxy s24 lying", width: 780, height: 360, touch: true },
  { name: "galaxy s24 lying, bars", width: 780, height: 300, touch: true },
  { name: "iphone se", width: 375, height: 667, touch: true },
  { name: "iphone se, bars", width: 375, height: 548, touch: true },
  { name: "iphone se lying", width: 667, height: 375, touch: true },
  { name: "iphone se lying, bars", width: 667, height: 320, touch: true },
  { name: "ipad", width: 820, height: 1180, touch: true },
  { name: "ipad lying", width: 1180, height: 820, touch: true },
  { name: "laptop", width: 1440, height: 900, touch: false },
  { name: "small window", width: 800, height: 600, touch: false },
] as const;

const stageOf = (screen: (typeof SCREENS)[number]) => {
  const { stage } = deckOf(screen.width, screen.height, screen.touch);
  const scale = scaleOf(stage.w, stage.h);
  return { width: Math.ceil(stage.w / scale), height: Math.ceil(stage.h / scale) };
};

test("every screen from an iPhone SE up is playable", () => {
  for (const screen of SCREENS) assert.ok(playable(stageOf(screen)), screen.name);
});

test("a folded phone is too small, and says so instead of playing", () => {
  const { stage } = deckOf(280, 650, true);
  const scale = scaleOf(stage.w, stage.h);
  assert.equal(
    playable({ width: Math.ceil(stage.w / scale), height: Math.ceil(stage.h / scale) }),
    false,
  );
});

test("words wrap on spaces, and a word longer than a line is cut", () => {
  assert.deepEqual(linesOf({ text: "SHIPS FAST TESTS FIRST", width: 59 }), [
    "SHIPS FAST",
    "TESTS",
    "FIRST",
  ]);
  assert.deepEqual(linesOf({ text: "ABCDEFGHIJKL", width: 35 }), ["ABCDEF", "GHIJKL"]);
  for (const line of linesOf({ text: "04:04 · MAP NOT FOUND, YET HERE IT IS", width: 170 }))
    assert.ok(widthOf({ text: line }) <= 170, line);
});

test("a text is as big as fits on one line, or wraps small", () => {
  assert.deepEqual(fitText({ text: "PAUSED", width: 200, max: 5 }), {
    scale: 5,
    lines: ["PAUSED"],
  });
  assert.equal(
    fitText({ text: "TURN YOUR PHONE FOR A BIGGER STAGE", width: 170, max: 2 }).scale,
    1,
  );
  assert.ok(
    fitText({ text: "TURN YOUR PHONE FOR A BIGGER STAGE", width: 170, max: 2 }).lines.length > 1,
  );
});

test("a column never overlaps itself and never leaves the room", () => {
  const pieces = [
    { kind: "text", text: "CONTINUE?", max: 3 },
    { kind: "text", text: "9", max: 8 },
    { kind: "text", text: "TAP TO CARRY ON", max: 1, optional: true },
  ] as const;
  for (const screen of SCREENS) {
    const { width, height } = stageOf(screen);
    const { placed, fits } = column({
      pieces,
      top: 8,
      bottom: height - 8,
      width: width - 16,
      gap: 6,
    });
    assert.ok(fits, screen.name);
    const shown = placed.filter((p) => p !== undefined);
    shown.forEach((p, i) => {
      assert.ok(p.y >= 8 && p.y + p.height <= height - 8, `${screen.name}: piece ${i} inside`);
      const next = shown.at(i + 1);
      if (next) assert.ok(p.y + p.height <= next.y, `${screen.name}: piece ${i} clear of the next`);
    });
  }
});

test("a short stage drops the optional pieces before cramming", () => {
  const { placed, fits } = column({
    pieces: [
      { kind: "box", height: 60 },
      { kind: "text", text: "A HINT NOBODY NEEDS TO READ", max: 1, optional: true },
    ],
    top: 0,
    bottom: 64,
    width: 100,
    gap: 6,
  });
  assert.ok(fits);
  assert.equal(placed.at(1), undefined);
});

test("rows are cut into pages that fit", () => {
  assert.deepEqual(pagesOf({ heights: [40, 40, 40, 90, 10], room: 100 }), [[0, 1], [2], [3, 4]]);
});

test("the boss bar and the banners never sit on the HUD, nor on each other", () => {
  const hud = { right: 127, bottom: 44 };
  for (const screen of SCREENS) {
    const { width, height } = stageOf(screen);
    const zones = zonesOf({ width, height, hud });
    const barLeft = (width - zones.bar.width) / 2;
    const besideHud = barLeft >= hud.right;
    assert.ok(besideHud || zones.bar.name >= hud.bottom, `${screen.name}: bar clear of the HUD`);
    assert.ok(zones.banner >= zones.bar.bottom, `${screen.name}: banner under the bar`);
    assert.ok(zones.goOn > zones.banner, `${screen.name}: go-on sign under the banner`);
    assert.ok(zones.goOn < height - 24, `${screen.name}: go-on sign above the ground`);
  }
});

test("an absent piece keeps its slot and takes no room", () => {
  const { placed } = column({
    pieces: [{ kind: "box", height: 10 }, undefined, { kind: "box", height: 10 }],
    top: 0,
    bottom: 26,
    width: 100,
    gap: 6,
  });
  assert.equal(placed.at(1), undefined);
  assert.equal(placed.at(2)?.y, 16);
});

test("a line that must stay one line is cut to the width", () => {
  assert.equal(clipLine({ text: "SHORT", width: 60 }), "SHORT");
  const cut = clipLine({ text: "AT NODE_MODULES/SCHEDULER.JS:4", width: 100 });
  assert.ok(cut.endsWith("..") && widthOf({ text: cut }) <= 100, cut);
});
