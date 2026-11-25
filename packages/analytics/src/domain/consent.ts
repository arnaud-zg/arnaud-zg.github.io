import { PLAN_VERSION } from "./plan.ts";

export type Choice = "granted" | "refused";
export type Status = Choice | "unasked";
// The one event of a visitor's consent. Stored as it is: its shape never changes.
export type SavedChoice = { readonly choice: Choice; readonly at: number; readonly plan: number };

// A yes or a no is kept six months, as the CNIL recommends, then asked again.
export const CHOICE_LASTS_MS = 183 * 24 * 60 * 60 * 1000;

// Rebuilt from the last choice, which replaces the earlier ones: no history of a visitor is kept.
export class Consent {
  readonly #last: SavedChoice | undefined;

  private constructor(last: SavedChoice | undefined) {
    this.#last = last;
  }

  static from(saved: SavedChoice | undefined): Consent {
    return new Consent(saved);
  }

  decide({ choice, now }: { choice: Choice; now: number }): SavedChoice {
    return { choice, at: now, plan: PLAN_VERSION };
  }

  evolve(event: SavedChoice): Consent {
    return new Consent(event);
  }

  // Without an explicit choice, a browser that objects is a no, and is not asked.
  statusAt({ now, objects }: { now: number; objects: boolean }): Status {
    const last = this.#last;
    if (last && this.#stands({ last, now })) return last.choice;
    return objects ? "refused" : "unasked";
  }

  #stands({ last, now }: { last: SavedChoice; now: number }): boolean {
    const age = now - last.at;
    const covered = last.choice === "refused" || last.plan === PLAN_VERSION;
    return age >= 0 && age < CHOICE_LASTS_MS && covered;
  }
}
