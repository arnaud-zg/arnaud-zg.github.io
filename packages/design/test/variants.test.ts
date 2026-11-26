import assert from "node:assert/strict";
import { test } from "node:test";

import { defineVariants } from "../src/variants.ts";

const card = defineVariants(
  { size: ["small", "large"], tone: ["plain", "loud", "quiet"] },
  { size: "small", tone: "plain" },
);

test("variants: a choice becomes data attributes, defaults filled in", () => {
  assert.deepEqual(card.attrs({ tone: "loud" }), { "data-size": "small", "data-tone": "loud" });
  assert.deepEqual(card.attrs(), { "data-size": "small", "data-tone": "plain" });
});

test("variants: every combination is listed once, the defaults first", () => {
  const all = card.all();
  assert.equal(all.length, 6);
  assert.deepEqual(all[0], { size: "small", tone: "plain" });
  assert.equal(new Set(all.map((c) => `${c.size}/${c.tone}`)).size, 6);
});
