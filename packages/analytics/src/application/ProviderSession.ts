import type { AnalyticsEvent } from "../domain/plan.ts";
import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";

// A provider that fails never breaks the page.
const quietly = (act: () => void) => {
  try {
    act();
  } catch {
    /* analytics is never worth an error */
  }
};

// From a yes to the next no. A provider that finishes loading after the no never starts.
export class ProviderSession {
  readonly #running: Promise<AnalyticsProvider | undefined>;
  #over = false;

  constructor(load: () => Promise<AnalyticsProvider>) {
    this.#running = load()
      .then((provider) => this.#begin(provider))
      .catch(() => undefined);
  }

  track(event: AnalyticsEvent): void {
    void this.#running.then((provider) => {
      if (!this.#over) quietly(() => provider?.track(event));
    });
  }

  end(): undefined {
    this.#over = true;
    void this.#running.then((provider) => quietly(() => provider?.stop()));
  }

  #begin(provider: AnalyticsProvider): AnalyticsProvider | undefined {
    if (this.#over) return undefined;
    quietly(() => provider.start());
    return provider;
  }
}
