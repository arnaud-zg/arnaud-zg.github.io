import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";

// For development: shows what would be sent, and sends nothing.
export const mock = (): AnalyticsProvider => ({
  start: () => console.info("[analytics mock] start"),
  track: (e) => console.info("[analytics mock]", e.name, JSON.stringify(e.props)),
  stop: () => console.info("[analytics mock] stop"),
});
