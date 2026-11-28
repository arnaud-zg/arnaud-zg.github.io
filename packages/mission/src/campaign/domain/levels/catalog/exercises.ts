// Exercises and decisions a level places by id: a nod to interview classics, never an interview.
import type { Exercise } from "../../../../challenge/domain/exercise.ts";
import { INCIDENTS } from "./incidents.ts";
import { LOOP_CONSOLES } from "./loops.ts";

const TREE = [50, 30, 70, 20, 42, 60, 80]; // level order: 50 at the root, its children, theirs

export const EXERCISES = {
  matryoshka: {
    id: "matryoshka",
    kind: "quiz",
    title: "THE MATRYOSHKA",
    speaker: "THE SENIOR",
    intro: "COUNTDOWN(N) CALLS COUNTDOWN(N - 1). EACH DOLL HOLDS A SMALLER ONE.",
    points: 1500,
    time: 20,
    steps: [
      {
        ask: "WHAT STOPS IT?",
        figure: { kind: "dolls", labels: ["COUNTDOWN(3)", "COUNTDOWN(2)", "COUNTDOWN(1)", "?"] },
        choices: [
          {
            text: "WHEN N IS 0, STOP",
            right: true,
            says: "BASE CASE. THE SMALLEST DOLL HOLDS NOTHING.",
          },
          {
            text: "WHEN N IS 1000, STOP",
            says: "IT COUNTS DOWN, NOT UP. ENJOY THE VIEW.",
            gag: "overflow",
          },
          { text: "NOTHING, IT STOPS ITSELF", says: "FAMOUS LAST WORDS.", gag: "overflow" },
        ],
      },
    ],
  },
  lockers: {
    id: "lockers",
    kind: "quiz",
    title: "THE LOCKERS",
    speaker: "THE TECH LEAD",
    intro: "EACH CV GOES IN LOCKER (LETTERS % 4). NO SEARCHING, EVER.",
    points: 1500,
    time: 20,
    steps: [
      {
        ask: "REACT HAS 5 LETTERS. WHICH LOCKER?",
        figure: {
          kind: "lockers",
          lockers: 4,
          items: [{ key: "GO", locker: 2 }, { key: "PHP", locker: 3 }, { key: "REACT" }],
        },
        choices: [
          { text: "LOCKER 0", says: "5 % 4 IS 1. THE CV IS LOST IN HR FOREVER." },
          { text: "LOCKER 1", right: true, says: "5 % 4 IS 1. ONE HOP, NO SEARCH: A HASHMAP." },
          { text: "LOCKER 2", says: "THAT ONE IS GO'S. GO DOES NOT SHARE." },
          { text: "LOCKER 3", says: "PHP LIVES THERE. IT HAS SEEN THINGS." },
        ],
      },
      {
        ask: "SQL HAS 3 LETTERS TOO: LOCKER 3, WITH PHP. NOW WHAT?",
        figure: {
          kind: "lockers",
          lockers: 4,
          items: [
            { key: "REACT", locker: 1 },
            { key: "GO", locker: 2 },
            { key: "PHP", locker: 3 },
            { key: "SQL", locker: 3 },
          ],
        },
        choices: [
          { text: "THROW PHP OUT", says: "PHP HAS SURVIVED WORSE. IT'S BACK." },
          {
            text: "CHAIN THEM IN THE LOCKER",
            right: true,
            says: "A COLLISION, HANDLED. STILL O(1) ON AVERAGE.",
          },
          { text: "A NEW LOCKER PER CV", says: "THE BUDGET MEETING IS GOING TO BE FUN." },
        ],
      },
    ],
  },
  "name-the-context": {
    id: "name-the-context",
    kind: "decision",
    title: "NAME THE CONTEXT",
    speaker: "THE ARCHITECT",
    intro: "THE PART THAT BOOKS APPOINTMENTS NEEDS A NAME. IT STICKS FOR THE WHOLE RUN.",
    points: 0,
    time: 25,
    steps: [
      {
        ask: "WHAT DO WE CALL IT?",
        choices: [
          {
            text: "APPOINTMENTBOOKING",
            names: true,
            perk: "language",
            says: "THE DOCTORS NOD. EVERYONE SPEAKS THE SAME LANGUAGE NOW.",
          },
          {
            text: "SCHEDULING",
            names: true,
            perk: "language",
            says: "SHORT AND CLEAR. EVEN THE PM CAN SPELL IT.",
          },
          {
            text: "BOOKINGMANAGERHELPER",
            names: true,
            debt: 2,
            says: "A MANAGER THAT HELPS. NOBODY KNOWS WHAT IT DOES. DEBT +2.",
          },
          {
            text: "CORE",
            names: true,
            debt: 1,
            says: "EVERYTHING IS CORE NOW. THE BUGS TOO. DEBT +1.",
          },
        ],
      },
    ],
  },
  race: {
    id: "race",
    kind: "quiz",
    title: "THE RACE",
    speaker: "THE PERF NERD",
    intro: "THREE WAYS TO FIND ONE TICKET AMONG N. BET ON THE WINNER.",
    points: 1500,
    time: 20,
    steps: [
      {
        ask: "WHO WINS WHEN N IS 1,000,000?",
        figure: {
          kind: "race",
          racers: [
            { label: "LOOP OVER ALL", grows: "linear" },
            { label: "LOOP IN A LOOP", grows: "square" },
            { label: "LOOK UP BY ID", grows: "constant" },
          ],
        },
        choices: [
          { text: "LOOP OVER ALL", says: "O(N). FINE, UNTIL BLACK FRIDAY." },
          { text: "LOOP IN A LOOP", says: "O(N X N). STILL RUNNING. SEE YOU NEXT SPRINT." },
          { text: "LOOK UP BY ID", right: true, says: "O(1). IT WAS OVER BEFORE IT STARTED." },
        ],
      },
      {
        ask: "AND A LOOP IN A LOOP IS...",
        choices: [
          { text: "O(N)", says: "ONE LOOP IS O(N). THE SECOND ONE MULTIPLIES." },
          { text: "O(N X N)", right: true, says: "N TIMES N. THE LAPTOP FAN AGREES." },
          { text: "O(LOG N)", says: "THAT'S HALVING. THIS IS DOUBLING DOWN." },
        ],
      },
    ],
  },
  "route-the-packet": {
    id: "route-the-packet",
    kind: "quiz",
    title: "ROUTE THE PACKET",
    speaker: "THE BACKEND DEV",
    intro: "A BINARY SEARCH TREE: SMALLER ON THE LEFT, BIGGER ON THE RIGHT. FIND 42.",
    points: 1500,
    time: 15,
    steps: [
      {
        ask: "AT 50. WHICH WAY TO 42?",
        arrows: true,
        figure: { kind: "tree", values: TREE, path: [0] },
        choices: [
          { text: "← LEFT", right: true, says: "42 IS SMALLER: LEFT IT IS." },
          { text: "RIGHT →", says: "42 IS NOT BIGGER THAN 50. LOST IN THE BRANCHES." },
        ],
      },
      {
        ask: "AT 30. AND NOW?",
        arrows: true,
        figure: { kind: "tree", values: TREE, path: [0, 1] },
        choices: [
          { text: "← LEFT", says: "42 IS BIGGER THAN 30. THAT WAY LIES 20." },
          { text: "RIGHT →", right: true, says: "FOUND IN 3 STEPS. HALF THE TREE GONE EACH TIME." },
        ],
      },
      {
        ask: "HOW MANY STEPS IN A TREE OF 1,000?",
        figure: { kind: "tree", values: TREE, path: [0, 1, 4] },
        choices: [
          {
            text: "ABOUT 10",
            right: true,
            says: "HALVING EACH STEP: LOG2(1000), ABOUT 10. O(LOG N).",
          },
          { text: "ABOUT 500", says: "THAT'S A LIST, NOT A TREE." },
          { text: "ALL 1,000", says: "THAT'S A LINKED LIST WEARING A TREE COSTUME." },
        ],
      },
    ],
  },
  "draw-the-boundary": {
    id: "draw-the-boundary",
    kind: "decision",
    title: "DRAW THE BOUNDARY",
    speaker: "THE ARCHITECT",
    intro: "BILLING AND SCHEDULING BOTH TALK ABOUT A PATIENT. SAME WORD, DIFFERENT NEEDS.",
    points: 0,
    time: 25,
    steps: [
      {
        ask: "WHERE DOES PATIENT LIVE?",
        choices: [
          {
            text: "ONE PATIENT, SHARED BY BOTH",
            debt: 2,
            says: "EVERY CHANGE NOW BREAKS THE OTHER TEAM. DEBT +2.",
          },
          {
            text: "EACH CONTEXT ITS OWN PATIENT",
            debt: -1,
            perk: "language",
            says: "TWO MODELS, ONE WORD, CLEAN EDGES. DEBT -1.",
          },
          { text: "A PATIENTSERVICE FOR ALL", debt: 1, says: "THE GOD SERVICE RISES. DEBT +1." },
        ],
      },
    ],
  },
  "guest-list": {
    id: "guest-list",
    kind: "quiz",
    title: "THE GUEST LIST",
    speaker: "THE SRE",
    intro: "10,000 GUESTS, EACH ONE CHECKED AT THE DOOR.",
    points: 1500,
    time: 20,
    steps: [
      {
        ask: "HOW DOES THE BOUNCER KEEP THE LIST?",
        figure: {
          kind: "race",
          racers: [
            { label: "READ IT ALL", grows: "linear" },
            { label: "A SET", grows: "constant" },
            { label: "SORT IT EACH TIME", grows: "nlogn" },
          ],
        },
        choices: [
          { text: "READ THE WHOLE LIST", says: "O(N) PER GUEST. THE QUEUE REACHES THE NEXT TOWN." },
          {
            text: "A SET: ONE LOOK",
            right: true,
            says: "O(1) PER GUEST. THE PARTY STARTS ON TIME.",
          },
          { text: "SORT IT FOR EACH GUEST", says: "O(N LOG N) PER GUEST. THE PARTY IS OVER." },
        ],
      },
    ],
  },
  fibonacci: {
    id: "fibonacci",
    kind: "quiz",
    title: "THE SLOW FIBONACCI",
    speaker: "THE STAFF ENGINEER",
    intro: "FIB(N) CALLS FIB(N - 1) AND FIB(N - 2). FIB(40) TAKES AGES.",
    points: 1500,
    time: 20,
    steps: [
      {
        ask: "WHY SO SLOW?",
        figure: {
          kind: "dolls",
          labels: ["FIB(4)", "FIB(3) FIB(2)", "FIB(2) FIB(1) FIB(1)", "FIB(1) ..."],
        },
        choices: [
          {
            text: "THE SAME CALLS, AGAIN AND AGAIN",
            right: true,
            says: "SO KEEP THE ANSWERS IN A HASHMAP. MEMOIZED, IT FLIES.",
          },
          { text: "JAVASCRIPT IS SLOW", says: "THE CLASSIC. IT WAS THE ALGORITHM." },
          { text: "40 IS A BIG NUMBER", says: "40 IS FINE. 331,160,281 CALLS ARE NOT." },
        ],
      },
    ],
  },
  shortcut: {
    id: "shortcut",
    kind: "decision",
    title: "THE SHORTCUT",
    speaker: "THE PM",
    intro: "THE DEADLINE IS TOMORROW. TWO SERVICES, ONE DATABASE. JUST THIS ONCE?",
    points: 0,
    time: 25,
    steps: [
      {
        ask: "SHARE THE DATABASE?",
        choices: [
          {
            text: "YES, SHIP IT",
            debt: 2,
            perk: "weapon",
            says: "SHIPPED! A NEW WEAPON NOW. THE INVOICE COMES LATER. DEBT +2.",
          },
          {
            text: "NO: AN EVENT BETWEEN THEM",
            debt: -1,
            says: "A DAY LATER, A LOT CLEANER. DEBT -1.",
          },
          {
            text: "LET'S HAVE A MEETING",
            debt: 1,
            says: "THE MEETING NEEDED A FOLLOW-UP MEETING. DEBT +1.",
          },
        ],
      },
    ],
  },
  ...INCIDENTS,
  ...LOOP_CONSOLES,
} as const satisfies Record<string, Exercise>;

export type ExerciseId = keyof typeof EXERCISES;
