import assert from "node:assert/strict";
import test from "node:test";

import { followGround, keptInLock } from "../src/moves/domain/ground.ts";

test("a turned phone moves what stands on the ground with the ground", () => {
  assert.equal(followGround({ height: 230, from: 246, to: 156 }), 140);
  assert.equal(followGround({ height: 140, from: 156, to: 246 }), 230);
});

test("a foe of a locked wave is brought back within the hero's reach", () => {
  assert.equal(keptInLock({ x: 300, width: 14, left: 100, right: 280 }), 266);
  assert.equal(keptInLock({ x: 40, width: 14, left: 100, right: 280 }), 100);
  assert.equal(keptInLock({ x: 150, width: 14, left: 100, right: 280 }), 150);
});
