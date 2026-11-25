export class Month {
  readonly #index: number;

  private constructor(index: number) {
    this.#index = index;
  }

  static of(isoDate: string): Month {
    const [year, month] = isoDate.split("-").map(Number);
    return new Month(year * 12 + month - 1);
  }

  static at(date: Date): Month {
    return new Month(date.getUTCFullYear() * 12 + date.getUTCMonth());
  }

  monthsUntil(later: Month): number {
    return later.#index - this.#index;
  }

  year(): number {
    return Math.floor(this.#index / 12);
  }
}
