import type { EventName } from "@arnaud-zg/analytics/plan";
import type { EventSource } from "../ports/EventSource.ts";

const LIMIT = 10000;
type Raw = Record<"visit" | "name" | "path" | "section" | "destination" | "item" | "source" | "device" | "action", string> & { seconds: number };

// Columns as written by analytics-engine.store.ts.
export const analyticsEngineSource = (account: string, token: string): EventSource => ({
  async last(days) {
    const query = `SELECT index1 AS visit, blob1 AS name, blob2 AS path, blob3 AS section, blob4 AS destination, blob5 AS item, blob6 AS source, blob7 AS device, blob8 AS action, double1 AS seconds
      FROM portfolio_events WHERE timestamp > NOW() - INTERVAL '${days}' DAY LIMIT ${LIMIT} FORMAT JSON`;
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: query });
    if (!r.ok) throw new Error(`Cloudflare answered ${r.status}: ${await r.text()}`);
    const { data } = await r.json() as { data: Raw[] };
    // Cutting visits in half would bend every rate.
    if (data.length >= LIMIT) throw new Error(`More than ${LIMIT} events: ask for fewer days.`);
    return data.map(({ visit, name, path, ...props }) => ({ visit, name: name as EventName, path, props: { ...props, seconds: Number(props.seconds) } }));
  },
});
