import type { Choice, Status } from "../domain/consent.ts";
import type { Props } from "../domain/plan.ts";
import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";
import type { ConsentStore } from "../ports/ConsentStore.ts";
import type { PrivacySignal } from "../ports/PrivacySignal.ts";
import type { StatusListener } from "./StatusListeners.ts";
import { Consent } from "../domain/consent.ts";
import { toEvent } from "../domain/plan.ts";
import { ProviderSession } from "./ProviderSession.ts";
import { StatusListeners } from "./StatusListeners.ts";

export type Needs = {
  store: ConsentStore;
  signal: PrivacySignal;
  now: () => number;
  // Called on a yes only, so the provider's code is not even downloaded before.
  provider: () => Promise<AnalyticsProvider>;
};

export class Analytics {
  readonly #needs: Needs;
  readonly #listeners = new StatusListeners();
  #status: Status = "unasked";
  #session: ProviderSession | undefined;

  constructor(needs: Needs) {
    this.#needs = needs;
  }

  start(): void {
    this.#needs.store.onChange(() => this.#follow(this.#consent()));
    this.#follow(this.#consent());
  }

  status(): Status {
    return this.#status;
  }

  choose(choice: Choice): void {
    const consent = this.#consent();
    const event = consent.decide({ choice, now: this.#needs.now() });
    this.#needs.store.write(event);
    this.#follow(consent.evolve(event));
  }

  // Called at once with the current status, then on every change.
  onStatus(listener: StatusListener): void {
    this.#listeners.add(listener);
    listener(this.#status);
  }

  track(name: string, props: Props): void {
    const event = toEvent(name, props);
    if (event) this.#session?.track(event);
  }

  #consent(): Consent {
    return Consent.from(this.#needs.store.read());
  }

  #follow(consent: Consent): void {
    const { now, signal, provider } = this.#needs;
    const next = consent.statusAt({ now: now(), objects: signal.objects() });
    if (next === "granted") this.#session ??= new ProviderSession(provider);
    if (next !== "granted") this.#session = this.#session?.end();
    if (next === this.#status) return;
    this.#status = next;
    this.#listeners.tell(next);
  }
}

export const createAnalytics = (needs: Needs) => new Analytics(needs);
