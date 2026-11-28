// The feedback loop's stages, shot by shot, and the consoles in its zone that make it faster.
import type { Exercise } from "../../../../challenge/domain/exercise.ts";
import type { LoopStage } from "../../../../challenge/domain/loop.ts";

export const LOOP_STAGES: readonly LoopStage[] = [
  { label: "RUNNING ALL 4,812 TESTS", eta: "ETA 14 MIN", build: 2.2, flaky: 0.2, backfire: 0 },
  { label: "AFFECTED TESTS ONLY", eta: "ETA 4 MIN", build: 1.1, flaky: 0.12, backfire: 0 },
  { label: "CACHED BUILDS", eta: "ETA 50 S", build: 0.5, flaky: 0.05, backfire: 0 },
  { label: "SHARDED ACROSS 8", eta: "ETA 8 S", build: 0.22, flaky: 0, backfire: 0 },
  { label: "HOT RELOAD", eta: "INSTANT", build: 0.07, flaky: 0, backfire: 0 },
];
export const TESTS_SKIPPED: LoopStage = {
  label: "TESTS SKIPPED",
  eta: "ETA 0 S",
  build: 0.08,
  flaky: 0,
  backfire: 0.25,
};

const consoleOf = (
  id: string,
  ask: string,
  intro: string,
  choices: Exercise["steps"][number]["choices"],
): Exercise => ({
  id,
  kind: "decision",
  skin: "terminal",
  title: "THE FEEDBACK LOOP",
  speaker: "THE PLATFORM TEAM",
  intro,
  points: 0,
  time: 25,
  steps: [{ ask, choices }],
});

export const LOOP_CONSOLES = {
  "loop-affected": consoleOf(
    "loop-affected",
    "FIRST MOVE?",
    "EVERY SHOT RUNS ALL 4,812 TESTS. 14 MINUTES A SHOT. MAKE THE LOOP FASTER.",
    [
      {
        text: "RUN ONLY THE TESTS THE CHANGE TOUCHES",
        perk: "faster",
        says: "THE DEPENDENCY GRAPH KNOWS. 14 MIN DOWN TO 4.",
      },
      { text: "BUY A FASTER LAPTOP", says: "THE LAPTOP IS FASTER. THE CI IS NOT." },
      {
        text: "SKIP THE TESTS",
        perk: "skipTests",
        debt: 2,
        says: "INSTANT! WHAT COULD GO WRONG? DEBT +2.",
      },
    ],
  ),
  "loop-cache": consoleOf(
    "loop-cache",
    "NEXT?",
    "THE SAME BUILD RUNS AGAIN AND AGAIN, FROM SCRATCH.",
    [
      {
        text: "CACHE IT: SAME INPUT, SAME OUTPUT",
        perk: "faster",
        says: "A HASHMAP OF BUILDS. 4 MIN DOWN TO 50 S.",
      },
      { text: "RETRY EVERY FLAKY TEST", says: "THE FLAKES ARE STILL THERE. NOW THEY RETRY." },
      { text: "ASK THE TEAM TO PUSH LESS", says: "THEY MUTED THE CHANNEL." },
    ],
  ),
  "loop-shard": consoleOf("loop-shard", "NEXT?", "50 SECONDS, ONE MACHINE, 4,812 TESTS IN A ROW.", [
    { text: "SHARD THEM ACROSS 8 MACHINES", perk: "faster", says: "IN PARALLEL. 50 S DOWN TO 8." },
    { text: "WRITE FEWER TESTS", says: "FEWER TESTS. MORE INCIDENTS." },
    { text: "RUN THEM AT NIGHT", says: "THE FEEDBACK NOW ARRIVES WITH BREAKFAST." },
  ]),
  "loop-reload": consoleOf("loop-reload", "LAST MOVE?", "8 SECONDS. ALMOST THERE.", [
    {
      text: "WATCH MODE AND HOT RELOAD",
      perk: "faster",
      says: "INSTANT FEEDBACK. THIS IS THE JOB.",
    },
    { text: "A MEETING ABOUT SPEED", says: "THE MEETING TOOK AN HOUR. THE BUILD, 8 SECONDS." },
    { text: "REWRITE IT IN A NEW FRAMEWORK", says: "THE REWRITE SHIPS NEXT YEAR. PROBABLY." },
  ]),
} as const satisfies Record<string, Exercise>;
