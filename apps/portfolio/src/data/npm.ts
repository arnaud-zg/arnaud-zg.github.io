// Side quests: the tools published on npm, read from the registry at build time.
// Scoped packages (@shiplane/fly, @migration-preflight/sqlite...) join their family so a
// tool and its plugins count as one. Download counts are deliberately not shown: npm
// counts mirror and scanner traffic and every plugin installed alongside, so they
// overstate real use. Releases are honest: each one is a deliberate publish.
//
// Grouping, the "Earlier" cut-off and the treemap threshold live in portfolio.config.ts.
import type { Group, Tile, Tool } from "@arnaud-zg/design/treemap";
import { TREEMAP_BOX as BOX, squarify } from "@arnaud-zg/design/treemap";

import config from "../../portfolio.config";
import { fallback } from "../lib/fallback";
import saved from "./snapshots/npm.json";

export type Quest = Tool & {
  keywords: string[];
  updated: string;
  version?: string;
  created?: string;
};
export type SideQuests = {
  tools: number;
  releases: number;
  downloads?: number;
  downloadsMonth?: string;
  groups: Group[];
  earlier: Quest[];
};

const {
  maintainer,
  parkedVersion,
  lines: lineOverrides,
  activeMonths,
  groups: groupRules,
  otherGroup,
  otherEmoji,
  minShare,
  minTileShare,
} = config.npm;
const SKIP = /^(reserved package name|coming soon)$/i;
// One group's box on phones, in arbitrary units.
const PHONE = { w: 16, h: 10 };

type Hit = {
  package: {
    name: string;
    version?: string;
    date?: string;
    description?: string;
    keywords?: string[];
    links?: { npm?: string };
  };
};

// The first clause of a description: what the tool does, not how.
const brief = (d: string) =>
  d
    .split(/:\s|\.\s|\s\(|,\s(?:like|without)\s/)[0]
    .replace(/\.$/, "")
    .trim();
const monthsAgo = (iso: string) => {
  const d = new Date(iso),
    now = new Date();
  return (now.getUTCFullYear() - d.getUTCFullYear()) * 12 + now.getUTCMonth() - d.getUTCMonth();
};

// The last full calendar month, e.g. { range: "2026-10-01:2026-10-31", label: "October 2026" }.
function lastMonth() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    range: `${iso(start)}:${iso(end)}`,
    label: start.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}

// Last month's downloads for every tool in one call: npm rate-limits one call per tool, which
// left some figures out. Unscoped names only, which every family's lead is.
async function downloadsOf(names: string[]): Promise<Map<string, number>> {
  const point = async () => {
    const res = await fetch(
      `https://api.npmjs.org/downloads/point/${lastMonth().range}/${names.join(",")}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`${res.status} npm downloads`);
    const body = await res.json();
    const all: Record<string, { downloads: number } | null> =
      names.length === 1 ? { [names[0]]: body } : body;
    return new Map(Object.entries(all).flatMap(([n, d]) => (d ? [[n, d.downloads] as const] : [])));
  };
  // One retry after a short pause, then the figures are left out.
  return point()
    .catch(() => new Promise((r) => setTimeout(r, 600)).then(point))
    .catch((error) => fallback("npm downloads", error, new Map()));
}

// Release count, latest version and first publish date from the package document.
async function detailsOf(name: string) {
  const res = await fetch(`https://registry.npmjs.org/${name}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${res.status} ${name}`);
  const doc = await res.json();
  return {
    releases: Object.keys(doc.versions ?? {}).filter((v) => !parkedVersion.test(v)).length,
    version: doc["dist-tags"]?.latest as string | undefined,
    created: (doc.time?.created as string | undefined)?.slice(0, 10),
  };
}

export async function fetchQuests(): Promise<Quest[]> {
  const res = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=maintainer:${maintainer}&size=250`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) throw new Error(String(res.status));
  // Parked packages (latest is a 0.0.0 placeholder) are not tools yet, and do not count as plugins.
  const hits = ((await res.json()).objects as Hit[]).filter(
    (h) => !SKIP.test(h.package.description ?? "") && !parkedVersion.test(h.package.version ?? ""),
  );
  if (!hits.length) throw new Error("no packages");

  const families = new Map<string, { lead?: Hit; updated: string; members: number }>();
  for (const h of hits) {
    const family = h.package.name.startsWith("@")
      ? h.package.name.slice(1).split("/")[0]
      : h.package.name;
    const f = families.get(family) ?? { updated: "", members: 0 };
    const date = h.package.date?.slice(0, 10) ?? "";
    if (date > f.updated) f.updated = date;
    f.members += 1;
    if (h.package.name === family) f.lead = h;
    families.set(family, f);
  }
  const leads = [...families].flatMap(([name, f]) => {
    const pkg = f.lead?.package;
    return pkg?.description ? [{ name, f, pkg, about: pkg.description }] : [];
  });
  const downloads = await downloadsOf(leads.map(({ name }) => name));
  const quests = await Promise.all(
    leads.map(async ({ name, f, pkg, about }) => ({
      name,
      downloads: downloads.get(name),
      downloadsMonth: downloads.has(name) ? lastMonth().label : undefined,
      line: lineOverrides[name] ?? brief(about),
      href: pkg.links?.npm ?? `https://www.npmjs.com/package/${name}`,
      keywords: pkg.keywords ?? [],
      updated: f.updated,
      members: f.members,
      ...(await detailsOf(name)),
    })),
  );
  // A stable order, so refreshing the saved data only shows what changed.
  return quests.sort((a, b) => b.releases - a.releases || a.name.localeCompare(b.name));
}

// A tool joins the first configured group with a matching keyword or name part.
const groupOf = (q: Quest) => {
  const words = new Set([
    ...q.keywords.map((k) => k.toLowerCase()),
    ...q.name.toLowerCase().split("-"),
  ]);
  return groupRules.find((g) => g.match.some((m) => words.has(m)))?.name ?? otherGroup;
};
const sum = (qs: Quest[]) => qs.reduce((n, q) => n + q.releases, 0);
const isRecent = (q: Quest) => monthsAgo(q.updated) < 12;

// Two-level treemap: groups share the whole box, tools share their group.
function layout(active: Quest[]): Group[] {
  const total = sum(active);
  const byGroup = new Map<string, Quest[]>();
  for (const q of [...active].sort((a, b) => b.releases - a.releases)) {
    const g = groupOf(q);
    byGroup.set(g, [...(byGroup.get(g) ?? []), q]);
  }
  // Groups keep the order they are listed in portfolio.config.ts; anything unmatched goes last.
  const order = groupRules.map((g) => g.name as string);
  const rank = (name: string) => (order.includes(name) ? order.indexOf(name) : order.length);
  const entries = [...byGroup].sort(([a], [b]) => rank(a) - rank(b));
  // Drawn size: releases, floored so the smallest tile still holds its name.
  const weigh = (releases: number) => Math.max(releases, total * minTileShare);
  const weights = entries.map(([, qs]) => {
    const tooSmall = qs.filter((q) => q.releases / total < minShare);
    const merged = tooSmall.length > 1 ? [weigh(sum(tooSmall))] : [];
    return [
      ...qs
        .filter((q) => !(tooSmall.length > 1 && tooSmall.includes(q)))
        .map((q) => weigh(q.releases)),
      ...merged,
    ];
  });
  const outer = squarify(
    weights.map((ws) => ws.reduce((a, b) => a + b, 0)),
    BOX.w,
    BOX.h,
    true,
  );

  return entries.map(([name, quests], gi) => {
    // A lone small tool keeps its own tile; two or more share one "+n more" tile.
    const tooSmall = quests.filter((q) => q.releases / total < minShare);
    const small = tooSmall.length > 1 ? tooSmall : [];
    const shown = quests.filter((q) => !small.includes(q));
    const tiles: Omit<Tile, "rect" | "mrect">[] = shown.map((q) => ({
      tool: q,
      releases: q.releases,
      weight: weigh(q.releases),
      recent: isRecent(q),
    }));
    if (small.length)
      tiles.push({
        more: small,
        releases: sum(small),
        weight: weigh(sum(small)),
        recent: small.some(isRecent),
      });
    const r = outer[gi];
    const values = tiles.map((t) => t.weight);
    const inner = squarify(values, (r.w / 100) * BOX.w, (r.h / 100) * BOX.h, true);
    const phone = squarify(values, PHONE.w, PHONE.h, true);
    const emoji = groupRules.find((g) => g.name === name)?.emoji ?? otherEmoji;
    return {
      name,
      emoji,
      rect: r,
      tiles: tiles.map((t, i) => ({ ...t, rect: inner[i], mrect: phone[i] })),
    };
  });
}

export async function getSideQuests(): Promise<SideQuests> {
  let quests: Quest[];
  try {
    quests = await fetchQuests();
  } catch (error) {
    quests = fallback<Quest[]>("npm", error, saved);
  }
  const active = quests.filter((q) => monthsAgo(q.updated) < activeMonths);
  const earlier = quests
    .filter((q) => monthsAgo(q.updated) >= activeMonths)
    .sort((a, b) => b.updated.localeCompare(a.updated));
  const counted = active.filter((q) => q.downloads !== undefined);
  return {
    tools: active.length,
    releases: sum(active),
    // A total only when no figure is missing: never an understated number.
    downloads:
      active.length > 0 && counted.length === active.length
        ? counted.reduce((n, q) => n + (q.downloads ?? 0), 0)
        : undefined,
    downloadsMonth: counted[0]?.downloadsMonth,
    groups: layout(active),
    earlier,
  };
}

export const formatMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
