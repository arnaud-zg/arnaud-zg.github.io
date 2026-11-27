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

  includes(isoDate: string): boolean {
    return Month.of(isoDate).#index === this.#index;
  }

  // How many months back that date's month is: 0 for this one. A later month is never back.
  monthsSince(isoDate: string): number {
    const months = this.#index - Month.of(isoDate).#index;
    return months < 0 ? Infinity : months;
  }

  previous(): Month {
    return new Month(this.#index - 1);
  }

  firstDay(): string {
    return this.#start().toISOString().slice(0, 10);
  }

  lastDay(): string {
    const end = new Date(Date.UTC(this.year(), (this.#index % 12) + 1, 0));
    return end.toISOString().slice(0, 10);
  }

  label(): string {
    const format = { month: "long", year: "numeric", timeZone: "UTC" } as const;
    return this.#start().toLocaleDateString("en-GB", format);
  }

  #start(): Date {
    return new Date(Date.UTC(this.year(), this.#index % 12, 1));
  }
}
