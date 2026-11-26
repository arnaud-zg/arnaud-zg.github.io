import { Month } from "../../shared/domain/Month.ts";

export type PositionFacts = {
  readonly name: string;
  readonly industry?: string;
  readonly emoji?: string;
  readonly role: string;
  readonly start: string;
  readonly end?: string;
  readonly fullTime: boolean;
  readonly note?: string;
  readonly highlights?: readonly string[];
  readonly stack: string;
  readonly milestones?: readonly { at: string; label: string; title?: string }[];
};

const yearOf = (month: string) => month.slice(0, 4);

export class Position {
  readonly #facts: PositionFacts;

  constructor(facts: PositionFacts) {
    this.#facts = facts;
  }

  isFullTime(): boolean {
    return this.#facts.fullTime;
  }

  isCurrent(): boolean {
    return !this.#facts.end;
  }

  startMonth(): Month {
    return Month.of(this.#facts.start);
  }

  // The first and the last month both count, as on LinkedIn.
  monthsAt(today: Month): number {
    const { end } = this.#facts;
    return this.startMonth().monthsUntil(end ? Month.of(end) : today) + 1;
  }

  years(): { start: string; end?: string } {
    const { start, end } = this.#facts;
    return { start: yearOf(start), end: end && yearOf(end) };
  }

  // The first and last month as written, the last left out while it lasts.
  span(): { since: string; until?: string } {
    const { start, end } = this.#facts;
    return { since: start, until: end };
  }

  describe() {
    const { name, industry, emoji, role, note, highlights, stack } = this.#facts;
    return { name, industry, emoji, role, note, highlights, stack: stack.split(", ") };
  }

  // The starting title, then each promotion with its year.
  titles(): { title: string; since?: string }[] {
    const { role, milestones = [] } = this.#facts;
    const promotions = milestones.flatMap(({ title, at }) =>
      title ? [{ title, since: yearOf(at) }] : [],
    );
    return [{ title: role }, ...promotions];
  }
}
