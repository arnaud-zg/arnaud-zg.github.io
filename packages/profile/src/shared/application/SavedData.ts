// Strict, for a deploy: the site online stays, rather than going back to old numbers.
export class SavedData {
  readonly #strict: boolean;
  readonly #warn: (message: string) => void;

  constructor({ strict, warn }: { strict: boolean; warn: (message: string) => void }) {
    this.#strict = strict;
    this.#warn = warn;
  }

  insteadOf<T>({ source, error, saved }: { source: string; error: unknown; saved: T }): T {
    const reason = error instanceof Error ? error.message : String(error);
    if (this.#strict) throw new Error(`[${source}] no live data: ${reason}`);
    this.#warn(`[${source}] using saved data: ${reason}`);
    return saved;
  }
}
