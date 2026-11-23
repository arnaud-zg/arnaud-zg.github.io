import { kpisOf, signalsOf } from "../domain/kpis.ts";
import type { EventSource } from "../ports/EventSource.ts";

export const report = async (source: EventSource, days: number) => {
  const kpis = kpisOf(await source.last(days));
  return { kpis, signals: signalsOf(kpis) };
};
