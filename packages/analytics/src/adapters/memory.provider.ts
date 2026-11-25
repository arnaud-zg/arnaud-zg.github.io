import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";

export const memoryProvider = (): AnalyticsProvider & { readonly log: string[] } => {
  const log: string[] = [];
  return {
    log,
    start: () => void log.push("start"),
    track: ({ name }) => void log.push(name),
    stop: () => void log.push("stop"),
  };
};
