// Every provider, by the name used in the settings. To add one: an adapter, and a line here.
// Loaded on demand: no provider code reaches a visitor who has not said yes.
import type { AnalyticsProvider } from "./ports/AnalyticsProvider.ts";

type Provider = {
  // What the privacy dialog must say for it: the planned events, the country, the loading speed.
  discloses: readonly ("events" | "country" | "vitals")[];
  load: (setting: string) => Promise<AnalyticsProvider>;
};

export const providers: Record<string, Provider> = {
  "cloudflare-web-analytics": { discloses: ["country", "vitals"], load: async (token) => (await import("./adapters/cloudflare-web-analytics.provider.ts")).cloudflareWebAnalytics(token) },
  "cloudflare-events": { discloses: ["events"], load: async (url) => (await import("./adapters/cloudflare-events.provider.ts")).cloudflareEvents(url) },
  console: { discloses: ["events"], load: async () => (await import("./adapters/console.provider.ts")).consoleProvider() },
};
