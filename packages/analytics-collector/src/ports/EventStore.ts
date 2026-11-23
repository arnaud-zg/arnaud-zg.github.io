import type { VisitEvent } from "../domain/kpis.ts";

// Keeps events. Never an address, a browser name or anything else about the request.
export interface EventStore { keep(event: VisitEvent): void }
