import { collect } from "../application/collect.ts";
import type { EventStore } from "../ports/EventStore.ts";

const MAX = 2048;
const answer = (status: number) => new Response(null, { status });

export const handle = async (request: Request, needs: { store: EventStore; origin: string; allow: (key: string) => Promise<boolean> }): Promise<Response> => {
  if (request.method !== "POST") return answer(405);
  if (request.headers.get("origin") !== needs.origin) return answer(403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX) return answer(413);
  // The address only counts requests for a minute, in memory. It is never written.
  if (!(await needs.allow(request.headers.get("cf-connecting-ip") ?? "none"))) return answer(429);
  const text = await request.text();
  if (text.length > MAX) return answer(413);
  return answer(collect(needs.store, text) ? 204 : 400);
};
