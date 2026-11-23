// Wires the ports.
import { browserSignal } from "./adapters/browser.signal.ts";
import { bindAsk } from "./adapters/dom.ask.ts";
import { watchVisitor } from "./adapters/dom.visitor.ts";
import { localStorageConsent } from "./adapters/local-storage.consent.ts";
import { createAnalytics } from "./application/analytics.ts";
import type { Settings } from "./domain/settings.ts";
import { providers } from "./providers.ts";

export const startAnalytics = (settings: Settings) => {
  const analytics = createAnalytics({
    store: localStorageConsent(),
    signal: browserSignal(),
    now: Date.now,
    // One provider that fails to load leaves the others running.
    providers: async () => (await Promise.allSettled(Object.entries(settings).map(([name, setting]) => providers[name].load(setting)))).flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
  });
  analytics.start();
  bindAsk(analytics);
  let unwatch: (() => void) | undefined;
  analytics.onStatus((status) => {
    unwatch?.();
    unwatch = status === "granted" ? watchVisitor(analytics.track) : undefined;
  });
};
