// Side quests: the tools published on npm, read from the registry at build time.
// Scoped packages (@shiplane/fly, @migration-preflight/sqlite...) join their family so a
// tool and its plugins show as one row. Download counts are deliberately not shown: npm
// counts mirror and scanner traffic (a placeholder package with no code gets ~250 a month)
// and every plugin installed alongside, so they overstate real use. Recency is honest.

export type Quest = { name: string; line: string; href: string; tag: string; version: string; updated: string; members: number };
export type NpmStats = { tools: number; quests: Quest[] };

import config from "../../portfolio.config";

const MAINTAINER = config.npm.maintainer;
const SKIP = /^(reserved package name|coming soon)$/i;

// Snapshot taken 2026-11-21, used when the registry is unreachable.
const snapshot: NpmStats = {
  tools: 18,
  quests: [
    { name: "shiplane", line: "Release and deploy a monorepo in one command", href: "https://www.npmjs.com/package/shiplane", tag: "release", version: "0.6.0", updated: "2026-11-15", members: 8 },
    { name: "agent-context-budget", line: "Scores the markdown files an AI agent loads", href: "https://www.npmjs.com/package/agent-context-budget", tag: "ai agents", version: "", updated: "2026-11-14", members: 1 },
    { name: "vite-workspace-resolver", line: "Vite and Vitest plugin that resolves workspace packages' subpath imports", href: "https://www.npmjs.com/package/vite-workspace-resolver", tag: "vite", version: "", updated: "2026-11-14", members: 1 },
    { name: "expo-native-guard", line: "Load native-only modules safely in Expo Go", href: "https://www.npmjs.com/package/expo-native-guard", tag: "expo", version: "", updated: "2026-11-14", members: 1 },
    { name: "expo-pnpm-catalog", line: "Checks and syncs Expo SDK versions in pnpm catalogs", href: "https://www.npmjs.com/package/expo-pnpm-catalog", tag: "expo", version: "", updated: "2026-11-14", members: 1 },
    { name: "migration-preflight", line: "Test database migrations before you ship them", href: "https://www.npmjs.com/package/migration-preflight", tag: "database", version: "", updated: "2026-11-01", members: 3 },
  ],
};

type Hit = { package: { name: string; version?: string; date?: string; description?: string; keywords?: string[]; links?: { npm?: string; homepage?: string } } };

// The first clause of a description: what the tool does, not how.
const brief = (d: string) => d.split(/:\s|\.\s|\s\(|,\s(?:like|without)\s/)[0].replace(/\.$/, "").trim();
const TAGS: Record<string, string> = { "claude-code": "ai agents", "llm": "ai agents", "react-native": "expo", "vite-plugin": "vite", "eslint-plugin": "eslint" };
const tagOf = (k: string[] = []) => TAGS[k.find((x) => TAGS[x]) ?? ""] ?? k[0] ?? "tool";

export async function getNpmStats(): Promise<NpmStats> {
  try {
    const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=maintainer:${MAINTAINER}&size=250`, { signal: AbortSignal.timeout(8000) });
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
    const quests = [...families]
      .filter(([, f]) => f.lead?.package.description)
      .map(([name, f]) => ({
        name,
        line: brief(f.lead!.package.description!),
        href: f.lead!.package.links?.npm ?? `https://www.npmjs.com/package/${name}`,
        tag: tagOf(f.lead!.package.keywords),
        version: f.lead!.package.version ?? "",
        updated: f.updated,
        members: f.members,
      }))
      .sort((a, b) => b.updated.localeCompare(a.updated));
    return { tools: quests.length, quests };
  } catch (error) {
    console.warn(`[npm] using snapshot: ${(error as Error).message}`);
    return snapshot;
  }
}

export const formatMonth = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
