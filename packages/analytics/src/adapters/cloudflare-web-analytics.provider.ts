import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";

// Cloudflare's own beacon: page views and web vitals, in its dashboard. It takes no custom events.
export const cloudflareWebAnalytics = (token: string): AnalyticsProvider => ({
  start() {
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.dataset.cfBeacon = JSON.stringify({ token, spa: false });
    document.head.append(s);
  },
  track() {},
  // A script cannot be unloaded, and this one reports again as the page closes. The browser is told
  // to block it: until the next page, requests from this one reach this site only.
  stop() {
    const csp = document.createElement("meta");
    csp.httpEquiv = "Content-Security-Policy";
    csp.content = "connect-src 'self'";
    document.head.append(csp);
  },
});
