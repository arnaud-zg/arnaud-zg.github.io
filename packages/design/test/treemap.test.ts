import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { squarify } from "../src/treemap.ts";

// Layouts as squarify drew them before it kept running totals: the rewrite must draw the same.
const drawn = JSON.parse(readFileSync(new URL("fixtures/squarify.json", import.meta.url), "utf8"));
const many = Array.from({ length: 20 }, (_, i) => ((i * 37) % 11) + 1);

test("treemap: every layout is drawn exactly as before", () => {
  assert.deepEqual(
    {
      mixed: [squarify([6, 6, 4, 3, 2, 2, 1], 6, 4), squarify([6, 6, 4, 3, 2, 2, 1], 6, 4, true)],
      wide: [squarify([72, 24, 11, 10, 4, 4, 4, 3, 2], 16, 7, true)],
      empty: [squarify([], 16, 7)],
      zeros: [squarify([0, 0], 16, 7)],
      one: [squarify([5], 16, 7)],
      same: [squarify([3, 3, 3, 3], 4, 4)],
      many: [squarify(many, 16, 7, true), squarify(many, 7, 16)],
    },
    drawn,
  );
});

test("treemap: each tile's area is its share, and the tiles fill the box", () => {
  const values = [72, 24, 11, 10, 4, 4, 4, 3, 2];
  const total = values.reduce((a, b) => a + b);
  const rects = squarify(values, 16, 7, true);
  rects.forEach(({ w, h }, i) =>
    assert.ok(Math.abs((w * h) / 100 - (values[i] / total) * 100) < 1e-9),
  );
  const filled = rects.reduce((sum, { w, h }) => sum + w * h, 0);
  assert.ok(Math.abs(filled - 100 * 100) < 1e-6);
});
