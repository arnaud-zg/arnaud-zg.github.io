import type { Month } from "../../shared/domain/Month.ts";
import type { PositionFacts } from "./Position.ts";
import { Position } from "./Position.ts";
import { Positions } from "./Positions.ts";
import { roleOf, stintOf } from "./views.ts";

export type CareerFacts = {
  readonly stations: readonly PositionFacts[];
  readonly school: { readonly name: string; readonly role: string };
};

// Experience counts full-time positions; the others fold into the school's line.
export class Career {
  readonly #fullTime: Positions;
  readonly #partTime: Positions;
  readonly #school: CareerFacts["school"];

  constructor({ stations, school }: CareerFacts) {
    const positions = new Positions(stations.map((facts) => new Position(facts)));
    this.#fullTime = positions.fullTime();
    this.#partTime = positions.partTime();
    this.#school = school;
  }

  roles() {
    return this.#fullTime.newestFirst().map(roleOf);
  }

  early() {
    const { name, role } = this.#school;
    const stints = this.#partTime.newestFirst().map(stintOf);
    return { title: name, role, years: this.#partTime.span(), stints };
  }

  current() {
    const position = this.#fullTime.current();
    if (!position) throw new Error("a career needs a full-time position");
    const { role, name } = position.describe();
    return { role, company: name };
  }

  yearsAt(today: Month): number {
    return this.#fullTime.yearsUntil(today);
  }

  longestYearsAt(today: Month): number {
    return this.#fullTime.longestYears(today);
  }
}
