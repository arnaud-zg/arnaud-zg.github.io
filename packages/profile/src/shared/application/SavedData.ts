import type { Notices } from "../ports/Notices.ts";

type Replacement<T> = { source: string; saved: T; optional?: boolean };

// Strict, for a deploy: the site online stays, rather than going back to old numbers.
export class SavedData {
  readonly #strict: boolean;
  readonly #notices: Notices;

  constructor({ strict, notices }: { strict: boolean; notices: Notices }) {
    this.#strict = strict;
    this.#notices = notices;
  }

  // For a `catch`: what to use when the source is down. `optional`: never stops a strict run.
  insteadOf<T>({ source, saved, optional = false }: Replacement<T>): (error: unknown) => T {
    return (error) => {
      const reason = error instanceof Error ? error.message : String(error);
      if (this.#strict && !optional) throw new Error(`[${source}] no live data: ${reason}`);
      this.#notices.warn(`[${source}] using saved data: ${reason}`);
      return saved;
    };
  }
}
