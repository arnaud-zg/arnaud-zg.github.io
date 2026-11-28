import assert from "node:assert/strict";
import test from "node:test";

import type { Exercise } from "../src/challenge/domain/exercise.ts";
import { missingGlyphs } from "../src/arcade/adapters/pixel.font.ts";
import { EXERCISES } from "../src/campaign/domain/levels/catalog/exercises.ts";
import { MAPS } from "../src/campaign/domain/levels/index.ts";
import { resultOf, workOf } from "../src/challenge/domain/exercise.ts";

const all: readonly Exercise[] = Object.values(EXERCISES);
const rightOf = (exercise: Exercise, step: number) =>
  exercise.steps[step]?.choices.find((c) => c.right);
const wrongOf = (exercise: Exercise, step: number) =>
  exercise.steps[step]?.choices.find((c) => !c.right);

test("an incident fixed step by step is solved; one wrong step leaves production broken", () => {
  const incident = EXERCISES["prod-down"];
  const right = incident.steps.map((_, i) => ({ choice: rightOf(incident, i), seconds: 2 }));
  assert.equal(resultOf({ exercise: incident, answers: right }).solved, true);
  const forced = [
    ...right.slice(0, 2),
    { choice: incident.steps[2].choices.find((c) => c.text === "GIT PUSH --FORCE"), seconds: 2 },
  ];
  const result = resultOf({ exercise: incident, answers: forced });
  assert.deepEqual([result.solved, result.debt], [false, 2]);
});

test("a right answer at once pays it all, at the buzzer half, a wrong one nothing", () => {
  const quiz = EXERCISES.matryoshka;
  const now = resultOf({ exercise: quiz, answers: [{ choice: rightOf(quiz, 0), seconds: 0 }] });
  const late = resultOf({
    exercise: quiz,
    answers: [{ choice: rightOf(quiz, 0), seconds: quiz.time }],
  });
  const wrong = resultOf({ exercise: quiz, answers: [{ choice: wrongOf(quiz, 0), seconds: 1 }] });
  assert.deepEqual([now.points, late.points, wrong.points], [quiz.points, quiz.points / 2, 0]);
  assert.equal(now.solved, true);
  assert.equal(wrong.solved, false);
});

test("a timer that runs out costs points, never debt", () => {
  const result = resultOf({
    exercise: EXERCISES.race,
    answers: [
      { choice: undefined, seconds: 20 },
      { choice: undefined, seconds: 20 },
    ],
  });
  assert.deepEqual([result.points, result.debt, result.solved], [0, 0, false]);
});

test("a decision pays no points: it names the context, and owes or repays debt", () => {
  const decision = EXERCISES["name-the-context"];
  const bad = decision.steps[0].choices.find((c) => c.text === "BOOKINGMANAGERHELPER");
  const result = resultOf({ exercise: decision, answers: [{ choice: bad, seconds: 3 }] });
  assert.deepEqual([result.points, result.debt, result.name], [0, 2, "BOOKINGMANAGERHELPER"]);
  const clean = EXERCISES.shortcut.steps[0].choices.find(
    (c) => c.text === "NO: AN EVENT BETWEEN THEM",
  );
  assert.equal(
    resultOf({ exercise: EXERCISES.shortcut, answers: [{ choice: clean, seconds: 1 }] }).debt,
    -1,
  );
});

test("in the race, constant beats log beats linear beats n log n beats square", () => {
  const n = 1_000_000;
  const work = (["constant", "log", "linear", "nlogn", "square"] as const).map((grows) =>
    workOf({ grows, n }),
  );
  assert.deepEqual(
    work,
    [...work].sort((a, b) => a - b),
  );
});

for (const exercise of all) {
  test(`${exercise.id}: a quiz step has one right answer, a decision none`, () => {
    for (const step of exercise.steps) {
      const right = step.choices.filter((c) => c.right).length;
      assert.equal(right, exercise.kind === "decision" ? 0 : 1, step.ask);
      if (step.arrows) assert.equal(step.choices.length, 2, "arrows pick left or right");
    }
  });

  test(`${exercise.id}: every word on the whiteboard can be drawn`, () => {
    const words = [
      exercise.title,
      exercise.speaker,
      exercise.intro,
      ...exercise.steps.flatMap((s) => [s.ask, ...s.choices.flatMap((c) => [c.text, c.says])]),
    ];
    for (const w of words) assert.deepEqual(missingGlyphs(w), [], w);
  });
}

test("every level holds three whiteboards: two exercises and a decision", () => {
  for (const map of MAPS) {
    const ids = map.events.flatMap((e) => (e.kind === "exercise" ? [e.id] : []));
    const whiteboards: readonly Exercise[] = ids
      .map((id) => EXERCISES[id])
      .filter((e: Exercise) => e.skin !== "terminal");
    const kinds = whiteboards.map((e) => e.kind);
    assert.deepEqual(
      [kinds.filter((k) => k === "quiz").length, kinds.filter((k) => k === "decision").length],
      [2, 1],
      map.id,
    );
  }
});
