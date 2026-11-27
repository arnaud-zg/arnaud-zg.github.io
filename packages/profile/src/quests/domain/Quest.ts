import { Month } from "../../shared/domain/Month.ts";

export type QuestFacts = {
  readonly name: string;
  // The month that `downloads` and `monthlyReleases` cover. `yearlyReleases` covers the last year,
  // up to the refresh: this month so far and the eleven before it.
  readonly month: string;
  readonly downloads?: number;
  readonly line: string;
  readonly href: string;
  readonly keywords: string[];
  readonly updated: string;
  readonly members: number;
  readonly releases: number;
  readonly monthlyReleases: number;
  readonly yearlyReleases: number;
};
export type Age = { months: number; today: Month };

export class Quest {
  readonly #facts: QuestFacts;

  constructor(facts: QuestFacts) {
    this.#facts = facts;
  }

  // The first clause of a description: what the tool does, not how.
  static lineFrom(description: string): string {
    const [clause] = description.split(/:\s|\.\s|\s\(|,\s(?:like|without)\s/);
    return clause.replace(/\.$/, "").trim();
  }

  // Stable versions only: a nightly or a release candidate (1.0.0-rc.1) is not a release.
  static isRelease(version: string, parked: RegExp): boolean {
    return !version.includes("-") && !parked.test(version);
  }

  isUpdatedWithin({ months, today }: Age): boolean {
    return Month.of(this.#facts.updated).monthsUntil(today) < months;
  }

  isAbout(subjects: readonly string[]): boolean {
    const { keywords, name } = this.#facts;
    const words = [...keywords, ...name.split("-")].map((word) => word.toLowerCase());
    return subjects.some((subject) => words.includes(subject));
  }

  compareUpdate(other: Quest): number {
    return this.#facts.updated.localeCompare(other.#facts.updated);
  }

  asFacts(): QuestFacts {
    return this.#facts;
  }
}
