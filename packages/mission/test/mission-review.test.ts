import assert from "node:assert/strict";
import test from "node:test";

import type { MapRun } from "../src/combat/domain/score.ts";
import { TALLY } from "../src/campaign/domain/levels/catalog/points.ts";
import { Ledger } from "../src/challenge/domain/ledger.ts";
import { bonusOf, rankOf, reviewOf } from "../src/combat/domain/score.ts";

const run: MapRun = {
  fired: 100,
  landed: 60,
  deaths: 0,
  seconds: 120,
  par: 180,
  skills: 4,
  total: 4,
  bestChain: 5,
  exercises: { asked: 0, solved: 0, points: 0 },
  debt: 0,
  stage: 0,
};
const rowOf = (r: MapRun, id: string) =>
  reviewOf({ run: r, weights: TALLY }).find((row) => row.id === id);

test("coverage pays for every point of accuracy above the floor", () => {
  assert.equal(rowOf(run, "coverage")?.points, 30 * TALLY.coverage.perPoint);
  assert.equal(rowOf({ ...run, landed: 10 }, "coverage")?.points, 0);
  assert.equal(rowOf({ ...run, landed: 10 }, "coverage")?.verdict, "roast");
});

test("each death halves the zero-incident bonus", () => {
  assert.equal(rowOf(run, "incidents")?.points, TALLY.incidents);
  assert.equal(rowOf({ ...run, deaths: 2 }, "incidents")?.points, TALLY.incidents / 4);
});

test("lead time pays in full at par, nothing at twice par", () => {
  assert.equal(rowOf(run, "leadTime")?.points, TALLY.leadTime);
  assert.equal(rowOf({ ...run, seconds: 270 }, "leadTime")?.points, TALLY.leadTime / 2);
  assert.equal(rowOf({ ...run, seconds: 400 }, "leadTime")?.points, 0);
});

test("every skill picked up is worth more than most", () => {
  assert.equal(rowOf(run, "knowledge")?.points, 4 * TALLY.knowledge.perSkill * TALLY.knowledge.all);
  assert.equal(rowOf({ ...run, skills: 3 }, "knowledge")?.points, 3 * TALLY.knowledge.perSkill);
});

test("a map without exercises has no code review", () => {
  assert.equal(rowOf(run, "quality"), undefined);
  assert.equal(
    rowOf({ ...run, exercises: { asked: 2, solved: 1, points: 800 } }, "quality")?.points,
    800,
  );
});

test("debt costs interest, and the same debt costs more on a later map", () => {
  assert.equal(rowOf(run, "interest")?.points, 0);
  const early = rowOf({ ...run, debt: 2, stage: 0 }, "interest")?.points ?? 0;
  const late = rowOf({ ...run, debt: 2, stage: 2 }, "interest")?.points ?? 0;
  assert.ok(early < 0 && late < early, "compounds");
  assert.equal(
    bonusOf(reviewOf({ run: { ...run, debt: 50 }, weights: TALLY })) <
      bonusOf(reviewOf({ run, weights: TALLY })),
    true,
  );
});

test("an S rank needs next to no debt", () => {
  const clean = {
    cleared: true,
    continues: 0,
    deaths: 0,
    skills: 4,
    total: 4,
    accuracy: 0.6,
    debt: 0,
  };
  assert.equal(rankOf({ ...clean, debt: 2 }), "S");
  assert.equal(rankOf({ ...clean, debt: 3 }), "A");
});

test("the ledger adds debt, pays it back, never below zero", () => {
  const ledger = new Ledger();
  ledger.owe({ reason: "hotfix", amount: 2, stage: 0 });
  ledger.repay({ amount: 5, stage: 1 });
  assert.equal(ledger.total(), 0);
  assert.deepEqual(ledger.reasons(), ["hotfix"]);
});
