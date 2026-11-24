// The providers. To add one: an adapter, a case here, and its settings in domain/settings.ts.
// Loaded on demand: no provider code reaches a visitor who has not said yes.
import type { Settings } from "./domain/settings.ts";
import type { AnalyticsProvider } from "./ports/AnalyticsProvider.ts";

export const loadProvider = async (s: Settings): Promise<AnalyticsProvider> => {
  if (s.provider === "mock") return (await import("./adapters/mock.provider.ts")).mock();
  const environment = location.hostname === s.host ? "production" : "local";
  return (await import("./adapters/posthog.provider.ts")).posthog({
    key: s.key,
    region: s.region,
    environment,
  });
};
