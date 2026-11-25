import type { Month } from "../../shared/domain/Month.ts";
import type { Position } from "./Position.ts";

// In the order they were held.
export class Positions {
  readonly #positions: readonly Position[];

  constructor(positions: readonly Position[]) {
    this.#positions = positions;
  }

  fullTime(): Positions {
    return new Positions(this.#positions.filter((position) => position.isFullTime()));
  }

  partTime(): Positions {
    return new Positions(this.#positions.filter((position) => !position.isFullTime()));
  }

  current(): Position | undefined {
    return this.#positions.find((position) => position.isCurrent()) ?? this.#positions.at(-1);
  }

  yearsUntil(today: Month): number {
    const starts = this.#positions.map((position) => position.startMonth().year());
    return today.year() - Math.min(...starts);
  }

  longestYears(today: Month): number {
    const lengths = this.#positions.map((position) => position.monthsAt(today));
    return Math.round(Math.max(...lengths) / 12);
  }

  span(): string {
    const first = this.#positions.at(0);
    const last = this.#positions.at(-1);
    if (!first || !last) return "";
    return `${first.years().start}–${last.years().end ?? ""}`;
  }

  newestFirst(): Position[] {
    return [...this.#positions].reverse();
  }
}
