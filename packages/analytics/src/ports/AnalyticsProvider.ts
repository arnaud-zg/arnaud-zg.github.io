import type { AnalyticsEvent } from "../domain/plan.ts";

// Receives events of visitors who said yes. Never asks, stores on the device, or adds personal data.
export interface AnalyticsProvider {
  // Called once, after a yes: nothing may load or be sent before.
  start(): void;
  track(event: AnalyticsEvent): void;
  // After it, nothing more may leave the page.
  stop(): void;
}
