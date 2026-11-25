import { Month } from "../../shared/domain/Month.ts";

export type QuestFacts = {
  readonly name: string;
  readonly downloads?: number;
  readonly downloadsMonth?: string;
  readonly line: string;
  readonly href: string;
  readonly keywords: string[];
  readonly updated: string;
  readonly members: number;
  readonly releases: number;
  readonly version?: string;
  readonly created?: string;
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
  static releasesIn({ versions, parked }: { versions: readonly string[]; parked: RegExp }): number {
    return versions.filter((version) => {
      const [core] = version.split("+");
      return !core.includes("-") && !parked.test(version);
    }).length;
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
