import { PLAN_VERSION } from "./plan.ts";

export type Choice = "granted" | "refused";
export type SavedChoice = { readonly choice: Choice; readonly at: number; readonly plan: number };
export type Status = Choice | "unasked";

// A yes or a no is kept six months, as the CNIL recommends, then asked again.
export const CHOICE_LASTS_MS = 183 * 24 * 60 * 60 * 1000;

// An explicit choice wins. Without one, a browser that says "do not track" is a no, and is not asked.
export const statusOf = (saved: SavedChoice | undefined, now: number, objects: boolean): Status => {
  const age = saved ? now - saved.at : Infinity;
  const valid =
    saved &&
    age >= 0 &&
    age < CHOICE_LASTS_MS &&
    (saved.choice === "refused" || saved.plan === PLAN_VERSION);
  if (valid) return saved.choice;
  return objects ? "refused" : "unasked";
};

export const choose = (choice: Choice, now: number): SavedChoice => ({
  choice,
  at: now,
  plan: PLAN_VERSION,
});
