// The four KPIs, and what each says to check next. One visit is one page opened by someone who said yes.
import type { AnalyticsEvent } from "@arnaud-zg/analytics/plan";

export type VisitEvent = AnalyticsEvent & { readonly visit: string; readonly path: string };
export type Row = { readonly name: string; readonly visits: number; readonly seconds?: number; readonly rate?: number };
export type Kpis = { visits: number; engaged: number; explored: number; followed: number; sections: Row[]; sources: Row[]; devices: Row[]; explorations: Row[]; links: Row[] };

// Starting points, not benchmarks: move them once there is a first month to compare with.
export const TARGETS = { minVisits: 30, engaged: 0.5, explored: 0.15, followed: 0.1 };

export const kpisOf = (events: readonly VisitEvent[]): Kpis => {
  const byVisit = Map.groupBy(events, (e) => e.visit);
  // A visit whose first event was lost has no source: it cannot be counted fairly.
  const visits = [...byVisit.values()].filter((v) => v.some((e) => e.name === "page_viewed"));
  const did = (v: VisitEvent[], name: string) => v.some((e) => e.name === name);
  const share = (n: number, of: number) => (of ? n / of : 0);
  const part = (list: VisitEvent[][], test: (v: VisitEvent[]) => boolean) => share(list.filter(test).length, list.length);
  const followed = (v: VisitEvent[]) => did(v, "link_followed");

  const first = (key: "source" | "device") => [...Map.groupBy(visits, (v) => String(v.find((e) => e.name === "page_viewed")!.props[key]))]
    .map(([name, list]) => ({ name, visits: list.length, rate: part(list, followed) })).sort((a, b) => b.visits - a.visits);
  const all = visits.flat();
  const count = (name: string, label: (e: VisitEvent) => string): Row[] => [...Map.groupBy(all.filter((e) => e.name === name), label)].map(([key, list]) => ({
    name: key,
    visits: new Set(list.map((e) => e.visit)).size,
    ...(name === "section_read" ? { seconds: list.reduce((n, e) => n + Number(e.props.seconds), 0) } : {}),
  })).sort((a, b) => b.visits - a.visits);

  return {
    visits: visits.length,
    engaged: part(visits, (v) => new Set(v.filter((e) => e.name === "section_read").map((e) => e.props.section)).size >= 2),
    explored: part(visits, (v) => did(v, "content_explored")),
    followed: part(visits, followed),
    sections: count("section_read", (e) => String(e.props.section)),
    sources: first("source"),
    devices: first("device"),
    explorations: count("content_explored", (e) => `${e.props.action} ${e.props.item}`),
    links: count("link_followed", (e) => `${e.props.destination} from ${e.props.section}`),
  };
};

// What to look at next, in the order of the visit. Few visits say nothing yet.
export const signalsOf = (k: Kpis): string[] => {
  if (k.visits < TARGETS.minVisits) return [`Too early: ${k.visits} visits, ${TARGETS.minVisits} needed before reading anything into this.`];
  const out: string[] = [];
  if (k.engaged < TARGETS.engaged) out.push("Few visits read two sections. Check the hero and the headline numbers: do they give a reason to scroll?");
  if (k.explored < TARGETS.explored) out.push("Few visits open anything. Check that tiles and folded parts look clickable.");
  if (k.followed < TARGETS.followed) out.push(k.engaged >= TARGETS.engaged ? "Visitors read but do not follow through. Check that links sit beside the sections they read most." : "Few visits follow through. Fix reading first.");
  const enough = (list: Row[]) => list.filter((r) => r.visits >= TARGETS.minVisits / 3);
  const phone = enough(k.devices).find((r) => r.name === "phone"), desktop = enough(k.devices).find((r) => r.name === "desktop");
  if (phone && desktop && phone.rate! < desktop.rate! / 2) out.push("Phones follow through less than half as often as desktops. Check the phone layout.");
  const source = enough(k.sources).sort((a, b) => b.rate! - a.rate!)[0];
  if (source?.rate) out.push(`Visitors from "${source.name}" follow through most. Check how to bring more of them.`);
  const least = k.sections.at(-1);
  if (least && k.sections.length > 1 && least.visits < k.sections[0].visits / 4) out.push(`"${least.name}" is read least. Check its place on the page, or whether it is needed.`);
  return out.length ? out : ["Every KPI is on target. Raise one."];
};
