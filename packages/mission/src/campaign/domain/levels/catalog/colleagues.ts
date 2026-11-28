// The people met on the way: a behaviour the engine knows, and words ({context}: the run's name).
import type { ExerciseId } from "./exercises.ts";

// review: a code review; nag: nits that slow you unless guarded; scope: more foes mid-fight.
export type Behaviour = "review" | "nag" | "scope";
export type Colleague = {
  readonly name: string;
  readonly behaviour: Behaviour;
  readonly shirt: string;
  readonly hair: string;
  readonly arrive: string;
  readonly leave: string;
  readonly inDebt: string; // said instead of `arrive` when the run carries debt
  readonly review?: ExerciseId;
  readonly nits?: readonly string[];
  readonly extra?: number; // foes a scope change adds
};

export const COLLEAGUES = {
  architect: {
    name: "THE ARCHITECT",
    behaviour: "review",
    shirt: "#3b3f6b",
    hair: "#c9c9c9",
    arrive: "{context}? SHOW ME THE DIAGRAM FIRST.",
    inDebt: "WHO OWNS ALL THIS DEBT? SIT DOWN.",
    leave: "I'LL WRITE AN ADR ABOUT YOU.",
    review: "too-complex",
  },
  nitpicker: {
    name: "THE NITPICKER",
    behaviour: "nag",
    shirt: "#6b3b5a",
    hair: "#3a2620",
    arrive: "JUST A FEW NITS. NON-BLOCKING. MOSTLY.",
    inDebt: "THE DEBT IS FINE. THE SEMICOLONS ARE NOT.",
    leave: "LGTM. ALMOST.",
    nits: [
      "NIT: MISSING SEMICOLON",
      "NIT: TRAILING SPACE",
      "NIT: RENAME X",
      "NIT: TABS, NOT SPACES",
      "NIT: ADD A COMMENT",
      "NIT: REMOVE THAT COMMENT",
    ],
  },
  pm: {
    name: "THE PM",
    behaviour: "scope",
    shirt: "#b5532c",
    hair: "#e8c37a",
    arrive: "QUICK CHANGE? CAN {context} ALSO DO PAYMENTS?",
    inDebt: "THE DEBT CAN WAIT. THE ROADMAP CANNOT.",
    leave: "THANKS! SMALL THING, RIGHT?",
    extra: 2,
  },
} as const satisfies Record<string, Colleague>;

export type ColleagueId = keyof typeof COLLEAGUES;
