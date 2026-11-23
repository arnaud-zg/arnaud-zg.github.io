import { toEvent } from "@arnaud-zg/analytics/plan";
import type { EventStore } from "../ports/EventStore.ts";

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

// Keeps an event that follows the plan; says whether it did.
export const collect = (store: EventStore, text: string): boolean => {
  let body: unknown;
  try { body = JSON.parse(text); } catch { return false; }
  if (typeof body !== "object" || body === null) return false;
  const { visit, path, name, props } = body as Record<string, unknown>;
  const event = toEvent(name, props);
  if (!event || typeof visit !== "string" || !UUID.test(visit)) return false;
  if (typeof path !== "string" || !/^\/[\w./-]{0,120}$/.test(path)) return false;
  store.keep({ ...event, visit, path });
  return true;
};
