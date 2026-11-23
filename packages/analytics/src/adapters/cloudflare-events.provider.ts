import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";

// Product events, to the collector Worker. The visit id lives in memory and ends with the page.
export const cloudflareEvents = (url: string): AnalyticsProvider => {
  const visit = crypto.randomUUID();
  return {
    start() {},
    track({ name, props }) {
      // Plain text: no preflight, and it survives the page closing.
      navigator.sendBeacon(url, JSON.stringify({ visit, path: location.pathname, name, props }));
    },
    stop() {},
  };
};
