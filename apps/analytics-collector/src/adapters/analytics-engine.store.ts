import type { EventStore } from "../ports/EventStore.ts";

export type Dataset = { writeDataPoint(point: { indexes: string[]; blobs: string[]; doubles: number[] }): void };

// The order of the columns is the schema: analytics-engine.source.ts reads them back. Only ever add at the end.
export const analyticsEngine = (dataset: Dataset): EventStore => ({
  keep({ visit, name, path, props }) {
    const text = (key: string) => String(props[key] ?? "");
    dataset.writeDataPoint({
      indexes: [visit],
      blobs: [name, path, text("section"), text("destination"), text("item"), text("source"), text("device"), text("action")],
      doubles: [Number(props.seconds ?? 0)],
    });
  },
});
