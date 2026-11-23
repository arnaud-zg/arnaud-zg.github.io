import type { VisitEvent } from "../domain/kpis.ts";

// Reads back what was kept.
export interface EventSource { last(days: number): Promise<VisitEvent[]> }
