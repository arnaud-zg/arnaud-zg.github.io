import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";

// For development: shows what would be sent.
export const consoleProvider = (): AnalyticsProvider => ({
  start: () => console.info("[analytics] start"),
  track: (e) => console.info("[analytics]", e.name, JSON.stringify(e.props)),
  stop: () => console.info("[analytics] stop"),
});
