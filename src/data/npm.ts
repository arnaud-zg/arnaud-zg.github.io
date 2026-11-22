// Side quests: the tools published on npm, read from the registry at build time.
// Scoped packages (@shiplane/fly, @migration-preflight/sqlite...) join their family so a
// tool and its plugins count as one. Download counts are deliberately not shown: npm
// counts mirror and scanner traffic and every plugin installed alongside, so they
// overstate real use. Releases are honest: each one is a deliberate publish.
//
// Grouping, the "Earlier" cut-off and the treemap threshold live in portfolio.config.ts.

import config from "../../portfolio.config";
import { squarify, TREEMAP_BOX as BOX, type Rect } from "../lib/treemap";

// `downloads` covers the last full calendar month, named in `downloadsMonth`.
export type Quest = { name: string; line: string; href: string; keywords: string[]; releases: number; updated: string; members: number; version?: string; created?: string; downloads?: number; downloadsMonth?: string };
export type Tile = { quest?: Quest; more?: Quest[]; releases: number; weight: number; recent: boolean; rect: Rect; mrect: Rect };
export type Group = { name: string; emoji: string; releases: number; rect: Rect; tiles: Tile[] };
export type SideQuests = { tools: number; releases: number; downloads?: number; downloadsMonth?: string; groups: Group[]; earlier: Quest[] };

const { maintainer, activeMonths, groups: groupRules, otherGroup, otherEmoji, minShare, minTileShare } = config.npm;
const SKIP = /^(reserved package name|coming soon)$/i;
// One group's box on phones, in arbitrary units.
const PHONE = { w: 16, h: 10 };

// Snapshot taken 2026-11-22, used when the registry is unreachable.
const snapshot: Quest[] = [
  { name: "shiplane", line: "Release and deploy a monorepo in one command", href: "https://www.npmjs.com/package/shiplane", keywords: ["release", "deploy", "monorepo"], releases: 28, updated: "2026-11-15", members: 8 },
  { name: "blast-shield", line: "Technical debt protection tool for any codebase", href: "https://www.npmjs.com/package/blast-shield", keywords: ["technical-debt", "code-quality"], releases: 23, updated: "2026-04-21", members: 8 },
  { name: "eslint-plugin-feature-flags", line: "Lint rules to enforce feature flag hygiene", href: "https://www.npmjs.com/package/eslint-plugin-feature-flags", keywords: ["eslint", "feature-flags"], releases: 7, updated: "2025-06-15", members: 4 },
  { name: "expo-pnpm-catalog", line: "Checks and syncs Expo SDK versions in pnpm catalogs", href: "https://www.npmjs.com/package/expo-pnpm-catalog", keywords: ["expo", "react-native", "pnpm"], releases: 7, updated: "2026-11-14", members: 1 },
  { name: "expo-native-guard", line: "Load native-only modules safely in Expo Go", href: "https://www.npmjs.com/package/expo-native-guard", keywords: ["expo", "react-native"], releases: 7, updated: "2026-11-14", members: 1 },
  { name: "agent-context-budget", line: "Scores the markdown files an AI agent loads", href: "https://www.npmjs.com/package/agent-context-budget", keywords: ["claude-code", "llm", "ai-agents"], releases: 7, updated: "2026-11-14", members: 1 },
  { name: "vite-workspace-resolver", line: "Vite and Vitest plugin that resolves workspace packages' exports-map subpaths", href: "https://www.npmjs.com/package/vite-workspace-resolver", keywords: ["vite", "vite-plugin", "monorepo"], releases: 6, updated: "2026-11-14", members: 1 },
  { name: "migration-preflight", line: "Test database migrations before you ship them", href: "https://www.npmjs.com/package/migration-preflight", keywords: ["migration", "database"], releases: 4, updated: "2026-11-01", members: 3 },
  { name: "immutable-instance", line: "Makes immutable class instances reactive for front-end application", href: "https://www.npmjs.com/package/immutable-instance", keywords: ["react", "immutable"], releases: 2, updated: "2025-11-04", members: 1 },
  { name: "expo-catalog", line: "Deterministic Expo SDK checks and sync for workspace catalogs", href: "https://www.npmjs.com/package/expo-catalog", keywords: [], releases: 1, updated: "2026-06-19", members: 1 },
  { name: "http-response-status", line: "HTTP Status Map", href: "https://www.npmjs.com/package/http-response-status", keywords: [], releases: 1, updated: "2022-12-18", members: 1 },
  { name: "selector", line: "Generic selector library", href: "https://www.npmjs.com/package/selector", keywords: [], releases: 1, updated: "2022-06-24", members: 1 },
  { name: "popup-sensor", line: "Popup window sensor written in typescript", href: "https://www.npmjs.com/package/popup-sensor", keywords: [], releases: 1, updated: "2022-06-24", members: 1 },
  { name: "lazy-upload", line: "Simplify the file upload flow", href: "https://www.npmjs.com/package/lazy-upload", keywords: [], releases: 1, updated: "2020-08-26", members: 1 },
  { name: "ts-foursquare", line: "A simple library for Foursquare API", href: "https://www.npmjs.com/package/ts-foursquare", keywords: [], releases: 1, updated: "2020-08-01", members: 1 },
  { name: "react-lightsaber", line: "Just a simple lightsaber hosted on npmjs", href: "https://www.npmjs.com/package/react-lightsaber", keywords: [], releases: 1, updated: "2020-07-06", members: 1 },
  { name: "standalone-store", line: "Middleware for redux store in standalone mode for nodejs environment", href: "https://www.npmjs.com/package/standalone-store", keywords: [], releases: 1, updated: "2020-05-26", members: 1 },
  { name: "request-init", line: "Configuration toolset for fetch API", href: "https://www.npmjs.com/package/request-init", keywords: [], releases: 1, updated: "2020-02-28", members: 1 },
];

type Hit = { package: { name: string; date?: string; description?: string; keywords?: string[]; links?: { npm?: string } } };

// The first clause of a description: what the tool does, not how.
const brief = (d: string) => d.split(/:\s|\.\s|\s\(|,\s(?:like|without)\s/)[0].replace(/\.$/, "").trim();
const monthsAgo = (iso: string) => {
  const d = new Date(iso), now = new Date();
  return (now.getUTCFullYear() - d.getUTCFullYear()) * 12 + now.getUTCMonth() - d.getUTCMonth();
};

// The last full calendar month, e.g. { range: "2026-10-01:2026-10-31", label: "October 2026" }.
function lastMonth() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { range: `${iso(start)}:${iso(end)}`, label: start.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) };
}

// Release count, latest version and first publish date from the package document, plus
// last month's downloads. A failed download lookup just leaves the figure out.
async function detailsOf(name: string) {
  const res = await fetch(`https://registry.npmjs.org/${name}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${name}`);
  const doc = await res.json();
  const month = lastMonth();
  const downloads = await fetch(`https://api.npmjs.org/downloads/point/${month.range}/${name}`, { signal: AbortSignal.timeout(8000) })
    .then((r) => (r.ok ? r.json() : null)).then((d) => d?.downloads as number | undefined).catch(() => undefined);
  return {
    releases: Object.keys(doc.versions ?? {}).length,
    version: doc["dist-tags"]?.latest as string | undefined,
    created: (doc.time?.created as string | undefined)?.slice(0, 10),
    downloads,
    downloadsMonth: downloads === undefined ? undefined : month.label,
  };
}

async function fetchQuests(): Promise<Quest[]> {
  const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=maintainer:${maintainer}&size=250`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(String(res.status));
  const hits = ((await res.json()).objects as Hit[]).filter((h) => !SKIP.test(h.package.description ?? ""));
  if (!hits.length) throw new Error("no packages");

  const families = new Map<string, { lead?: Hit; updated: string; members: number }>();
  for (const h of hits) {
    const family = h.package.name.startsWith("@") ? h.package.name.slice(1).split("/")[0] : h.package.name;
    const f = families.get(family) ?? { updated: "", members: 0 };
    const date = h.package.date?.slice(0, 10) ?? "";
    if (date > f.updated) f.updated = date;
    f.members += 1;
    if (h.package.name === family) f.lead = h;
    families.set(family, f);
  }
  const leads = [...families].filter(([, f]) => f.lead?.package.description);
  return Promise.all(leads.map(async ([name, f]) => ({
    name,
    line: brief(f.lead!.package.description!),
    href: f.lead!.package.links?.npm ?? `https://www.npmjs.com/package/${name}`,
    keywords: f.lead!.package.keywords ?? [],
    updated: f.updated,
    members: f.members,
    ...(await detailsOf(name)),
  })));
}

// A tool joins the first configured group with a matching keyword or name part.
const groupOf = (q: Quest) => {
  const words = new Set([...q.keywords.map((k) => k.toLowerCase()), ...q.name.toLowerCase().split("-")]);
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
    (byGroup.get(g) ?? byGroup.set(g, []).get(g)!).push(q);
  }
  const entries = [...byGroup].sort(([, a], [, b]) => sum(b) - sum(a));
  // Drawn size: releases, floored so the smallest tile still holds its name.
  const weigh = (releases: number) => Math.max(releases, total * minTileShare);
  const weights = entries.map(([, qs]) => {
    const tooSmall = qs.filter((q) => q.releases / total < minShare);
    const merged = tooSmall.length > 1 ? [weigh(sum(tooSmall))] : [];
    return [...qs.filter((q) => !(tooSmall.length > 1 && tooSmall.includes(q))).map((q) => weigh(q.releases)), ...merged];
  });
  const outer = squarify(weights.map((ws) => ws.reduce((a, b) => a + b, 0)), BOX.w, BOX.h, true);

  return entries.map(([name, quests], gi) => {
    // A lone small tool keeps its own tile; two or more share one "+n more" tile.
    const tooSmall = quests.filter((q) => q.releases / total < minShare);
    const small = tooSmall.length > 1 ? tooSmall : [];
    const shown = quests.filter((q) => !small.includes(q));
    const tiles: Omit<Tile, "rect" | "mrect">[] = shown.map((q) => ({ quest: q, releases: q.releases, weight: weigh(q.releases), recent: isRecent(q) }));
    if (small.length) tiles.push({ more: small, releases: sum(small), weight: weigh(sum(small)), recent: small.some(isRecent) });
    const r = outer[gi];
    const values = tiles.map((t) => t.weight);
    const inner = squarify(values, (r.w / 100) * BOX.w, (r.h / 100) * BOX.h, true);
    const phone = squarify(values, PHONE.w, PHONE.h, true);
    const emoji = groupRules.find((g) => g.name === name)?.emoji ?? otherEmoji;
    return { name, emoji, releases: sum(quests), rect: r, tiles: tiles.map((t, i) => ({ ...t, rect: inner[i], mrect: phone[i] })) };
  });
}

export async function getSideQuests(): Promise<SideQuests> {
  let quests: Quest[];
  try {
    quests = await fetchQuests();
  } catch (error) {
    console.warn(`[npm] using snapshot: ${(error as Error).message}`);
    quests = snapshot;
  }
  const active = quests.filter((q) => monthsAgo(q.updated) < activeMonths);
  const earlier = quests.filter((q) => monthsAgo(q.updated) >= activeMonths).sort((a, b) => b.updated.localeCompare(a.updated));
  const counted = active.filter((q) => q.downloads !== undefined);
  return {
    tools: active.length,
    releases: sum(active),
    downloads: counted.length ? counted.reduce((n, q) => n + q.downloads!, 0) : undefined,
    downloadsMonth: counted[0]?.downloadsMonth,
    groups: layout(active),
    earlier,
  };
}

export const formatMonth = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
