import type { Notices } from "../ports/Notices.ts";

// Strict, for a deploy: the site online stays, rather than going back to old numbers.
export class SavedData {
  readonly #strict: boolean;
  readonly #notices: Notices;

  constructor({ strict, notices }: { strict: boolean; notices: Notices }) {
    this.#strict = strict;
    this.#notices = notices;
  }

  // For a `catch`: what to use when the source is down.
  insteadOf<T>({ source, saved }: { source: string; saved: T }): (error: unknown) => T {
    return (error) => {
      const reason = error instanceof Error ? error.message : String(error);
      if (this.#strict) throw new Error(`[${source}] no live data: ${reason}`);
      this.#notices.warn(`[${source}] using saved data: ${reason}`);
      return saved;
    };
  }
}
