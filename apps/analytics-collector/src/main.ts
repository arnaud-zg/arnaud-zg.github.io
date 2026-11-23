// Wires the Worker's bindings to the ports.
import { analyticsEngine, type Dataset } from "./adapters/analytics-engine.store.ts";
import { handle } from "./adapters/http.ts";

type Env = { EVENTS: Dataset; ALLOWED_ORIGIN: string; LIMITER: { limit(o: { key: string }): Promise<{ success: boolean }> } };

export default {
  fetch: (request: Request, env: Env) => handle(request, {
    store: analyticsEngine(env.EVENTS),
    origin: env.ALLOWED_ORIGIN,
    allow: async (key) => (await env.LIMITER.limit({ key })).success,
  }),
};
