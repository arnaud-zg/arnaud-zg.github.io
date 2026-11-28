// Production incidents: the game crashes into a terminal, and the fix is three steps away.
import type { Exercise } from "../../../../challenge/domain/exercise.ts";

export const INCIDENTS = {
  "prod-down": {
    id: "prod-down",
    kind: "incident",
    skin: "terminal",
    title: "PRODUCTION IS DOWN",
    speaker: "THE ON-CALL BOT",
    intro: "UNCAUGHT TYPEERROR: HERO.JUMP IS NOT A FUNCTION. 3,412 USERS STUCK MID-AIR.",
    points: 2000,
    time: 25,
    steps: [
      {
        ask: "WHERE DO YOU LOOK FIRST?",
        figure: {
          kind: "trace",
          lines: [
            "TYPEERROR: HERO.JUMP IS NOT A FUNCTION",
            "  AT UPDATE (GAME.TS:1316)",
            "  AT FRAME (GAME.TS:1032)",
            "  AT NODE_MODULES/SCHEDULER.JS:4",
          ],
        },
        choices: [
          {
            text: "GAME.TS:1316, OUR TOP FRAME",
            right: true,
            says: "THE FIRST LINE OF YOUR OWN CODE. START THERE.",
          },
          { text: "NODE_MODULES, OBVIOUSLY", says: "IT'S NEVER THE LIBRARY. OK, RARELY." },
          { text: "THE LAST LINE", says: "THE BOTTOM IS WHERE IT STARTED, NOT WHERE IT BROKE." },
        ],
      },
      {
        ask: "WHICH COMMIT BROKE IT?",
        choices: [
          {
            text: "GIT BISECT",
            right: true,
            says: "HALVE THE COMMITS EACH TIME: 7 STEPS FOR 100. BINARY SEARCH!",
          },
          {
            text: "RM -RF NODE_MODULES && NPM I",
            says: "DOWNLOADED HALF THE INTERNET. CHANGED NOTHING.",
          },
          { text: "TURN IT OFF AND ON AGAIN", says: "IT WORKED FOR 20 SECONDS. THEN IT DIDN'T." },
          { text: "BLAME THE INTERN", says: "THE INTERN WAS ON HOLIDAY. AWKWARD." },
        ],
      },
      {
        ask: "THE FIX IS READY. SHIP IT HOW?",
        choices: [
          {
            text: "RUN THE TESTS, THEN DEPLOY",
            right: true,
            says: "ALL GREEN. DEPLOYED. GO BACK TO BED.",
          },
          {
            text: "YOLO DEPLOY, IT'S FRIDAY",
            debt: 1,
            says: "IT DEPLOYED. IT ALSO BROKE BILLING. DEBT +1.",
          },
          { text: "GIT PUSH --FORCE", debt: 2, says: "YOU OVERWROTE A COLLEAGUE'S WEEK. DEBT +2." },
        ],
      },
    ],
  },
} as const satisfies Record<string, Exercise>;

// What the console says, over and over, while the game runs degraded.
export const SPAM: readonly string[] = [
  'CONSOLE.LOG("HERE")',
  'CONSOLE.LOG("HERE 2")',
  "WARNING: EACH CHILD SHOULD HAVE A UNIQUE KEY",
  "DEPRECATED: PLEASE UPGRADE TO V2",
  'CONSOLE.LOG("WHY IS THIS UNDEFINED")',
  "UNHANDLED PROMISE REJECTION",
  'CONSOLE.LOG("IT WORKS ON MY MACHINE")',
];
