import assert from "node:assert/strict";
import { test } from "node:test";
import { report } from "../src/application/report.ts";
import type { VisitEvent } from "../src/domain/kpis.ts";

const visit = (id: number, device: string, events: [VisitEvent["name"], VisitEvent["props"]][]): VisitEvent[] =>
  ([["page_viewed", { source: "linkedin", device }], ...events] as typeof events).map(([name, props]) => ({ visit: String(id), path: "/", name, props }));
const read = (section: string): [VisitEvent["name"], VisitEvent["props"]] => ["section_read", { section, seconds: 5 }];
const link: [VisitEvent["name"], VisitEvent["props"]] = ["link_followed", { section: "contact", destination: "github", item: "me" }];
const run = (events: VisitEvent[]) => report({ last: async () => events }, 30);

test("no visits, or too few, give no advice", async () => {
  const { kpis, signals } = await run([]);
  assert.equal(kpis.followed, 0);
  assert.match(signals[0], /Too early/);
});
test("rates count visits, not events", async () => {
  const { kpis } = await run([...visit(1, "phone", [read("about"), read("quests"), link, link]), ...visit(2, "phone", [read("about"), read("about")])]);
  assert.deepEqual([kpis.visits, kpis.engaged, kpis.followed], [2, 0.5, 0.5]);
  assert.deepEqual(kpis.sections[0], { name: "about", visits: 2, seconds: 15 });
});
test("weak KPIs say what to check next", async () => {
  const events = Array.from({ length: 40 }, (_, i) => visit(i, i < 20 ? "phone" : "desktop", i < 20 ? [read("about")] : [read("about"), read("quests"), link])).flat();
  const { signals } = await run(events);
  assert.ok(signals.some((s) => /look clickable/.test(s)));
  assert.ok(signals.some((s) => /phone layout/.test(s)));
  assert.ok(signals.some((s) => /"linkedin"/.test(s)));
  assert.ok(!signals.some((s) => /reason to scroll/.test(s)));
});
