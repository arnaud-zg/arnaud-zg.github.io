import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";

type Options = { key: string; region: "eu" | "us"; environment: "production" | "local" };

// Events straight to PostHog, with no SDK. The visit id lives in memory and ends with the page.
export const posthog = ({ key, region, environment }: Options): AnalyticsProvider => {
  const visit = crypto.randomUUID();
  return {
    start() {},
    track({ name, props }) {
      const properties = {
        ...props,
        path: location.pathname,
        environment,
        $process_person_profile: false,
        $geoip_disable: true,
      };
      // `keepalive` lets the last events leave as the page closes. Nothing waits for the answer.
      fetch(`https://${region}.i.posthog.com/i/v0/e/`, {
        method: "POST",
        keepalive: true,
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key, event: name, distinct_id: visit, properties }),
      }).catch(() => {});
    },
    stop() {},
  };
};
