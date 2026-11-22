// Open-source contributions: merged pull requests in other people's public repositories,
// fetched at build time from GitHub. Projects are ranked by what was contributed
// (features and fixes over chores), weighted by the project's reach and how recent it is.
// The page then groups substantive PRs by repo, largest total change first.

export type Change = { title: string; kind: string; year: number; url: string; added?: number; removed?: number };
export type Project = { repo: string; about: string; stars: number; changes: Change[]; score: number };
export type Row = Change & { repo: string; about: string; lines: number };
// `kinds` summarises what was contributed, e.g. "2 fixes" or "1 feature · 1 test".
export type RepoChanges = { repo: string; about: string; prs: Row[]; added: number; removed: number; lines: number; kinds: string };
export type Contributions = { repos: RepoChanges[] };

import config from "../../portfolio.config";

const USER = config.github.user;
// Never count work on my own account or on organisations I run (see portfolio.config.ts).
const PRIVATE_ORGS: readonly string[] = config.github.ownOrgs;
const KEEP = new Set(config.github.keepOrgs.map((o) => o.toLowerCase()));
const EXCLUDE = new Set(config.github.excludeRepos.map((r) => r.toLowerCase()));
// Only changes that say something about the work: no chores, docs or bare "Update X".
const SHOWN = new Set(["Feature", "Fix", "Performance", "Types", "Refactor", "Test"]);
const TRIVIAL = /typo|console log|optimi[sz]e images|readme|faq|^docs\b|hello-world|update \S+\.json|add ".*" on/i;
const WEIGHT: Record<string, number> = { Feature: 3, Fix: 3, Performance: 3, Types: 2.5, Refactor: 2, Change: 1.5, Test: 1.5, Docs: 0.5 };

type RawPr = { repo: string; title: string; url: string; date: string };
type RawRepo = { stars: number; about: string };

// Snapshot taken 2026-11-21 with an authenticated API call. Used when GitHub is unreachable or rate limited.
const snapshotRepos: Record<string, RawRepo> = {
  "web-infra-dev/rspack": { stars: 12987, about: "Fast Rust-based bundler for the web" },
  "ohmyzsh/ohmyzsh": { stars: 190707, about: "Framework for managing your zsh configuration" },
  "supasate/connected-react-router": { stars: 4681, about: "A Redux binding for React Router" },
  "module-federation/vite": { stars: 896, about: "Vite plugin for Module Federation" },
  "DefinitelyTyped/DefinitelyTyped": { stars: 51481, about: "High quality TypeScript type definitions" },
  "maticzav/graphql-middleware": { stars: 1146, about: "Split up your GraphQL resolvers in middleware functions" },
  "XD2Sketch/react-oauth-popup": { stars: 63, about: "React component for doing OAuth popups" },
  "Cero-Studio/ReactNativeWheelPicker": { stars: 387, about: "Wheel picker for React Native" },
};
const snapshotPrs: RawPr[] = [
  { repo: "Cero-Studio/ReactNativeWheelPicker", date: "2020-02-25", title: "feat(date-picker): display a custom date format for date picker", url: "https://github.com/Cero-Studio/ReactNativeWheelPicker/pull/103" },
  { repo: "DefinitelyTyped/DefinitelyTyped", date: "2019-09-27", title: "[@types/react-native-modal-filter-picker] Update type definition for ModalFilterPickerProps", url: "https://github.com/DefinitelyTyped/DefinitelyTyped/pull/38356" },
  { repo: "diezcami/arctic-fox-theme", date: "2016-04-04", title: "Fix align obsolete attribute", url: "https://github.com/diezcami/arctic-fox-theme/pull/4" },
  { repo: "Garee/skyscannerjs", date: "2016-11-19", title: "Update README.md", url: "https://github.com/Garee/skyscannerjs/pull/3" },
  { repo: "gitlabhq/gitlabhq", date: "2015-11-02", title: "Go to gitlab installation folder before initialize database", url: "https://github.com/gitlabhq/gitlabhq/pull/9794" },
  { repo: "keystonejs/generator-keystone", date: "2020-03-28", title: "Optimize images", url: "https://github.com/keystonejs/generator-keystone/pull/288" },
  { repo: "keystonejs/keystone", date: "2019-10-22", title: "docs: update authentication documentation", url: "https://github.com/keystonejs/keystone/pull/1807" },
  { repo: "keystonejs/keystone", date: "2019-10-30", title: "docs: update next app documentation", url: "https://github.com/keystonejs/keystone/pull/1860" },
  { repo: "maticzav/graphql-middleware", date: "2021-01-08", title: "fix(deps): move @graphql-tools/delegate to dependencies", url: "https://github.com/maticzav/graphql-middleware/pull/321" },
  { repo: "mermaid-js/mermaid", date: "2019-10-01", title: "Optimize images", url: "https://github.com/mermaid-js/mermaid/pull/966" },
  { repo: "module-federation/vite", date: "2026-11-16", title: "fix: name the exports field in the error when a shared package has no root", url: "https://github.com/module-federation/vite/pull/1579" },
  { repo: "muan/hello-world", date: "2016-05-25", title: "Create arnaud-zg.html", url: "https://github.com/muan/hello-world/pull/47" },
  { repo: "nextauthjs/next-auth", date: "2022-12-02", title: "chore(types): fix typo in comment", url: "https://github.com/nextauthjs/next-auth/pull/5815" },
  { repo: "nextauthjs/next-auth", date: "2022-12-14", title: "chore: removing console log", url: "https://github.com/nextauthjs/next-auth/pull/6061" },
  { repo: "ohmyzsh/ohmyzsh", date: "2023-01-09", title: "feat(jira): support rapid view on rapid board mode", url: "https://github.com/ohmyzsh/ohmyzsh/pull/9459" },
  { repo: "Orlands/snake-tj", date: "2015-10-19", title: "Add folder and file for workspace", url: "https://github.com/Orlands/snake-tj/pull/1" },
  { repo: "Orlands/snake-tj", date: "2015-10-19", title: "Add module name at REAME.md", url: "https://github.com/Orlands/snake-tj/pull/2" },
  { repo: "Orlands/snake-tj", date: "2015-10-21", title: "Add skeleton code of the project", url: "https://github.com/Orlands/snake-tj/pull/4" },
  { repo: "Orlands/snake-tj", date: "2015-10-26", title: "Push game skeleton", url: "https://github.com/Orlands/snake-tj/pull/5" },
  { repo: "Orlands/snake-tj", date: "2015-10-30", title: "Update", url: "https://github.com/Orlands/snake-tj/pull/6" },
  { repo: "Orlands/snake-tj", date: "2015-11-02", title: "Merge project", url: "https://github.com/Orlands/snake-tj/pull/7" },
  { repo: "Orlands/snake-tj", date: "2015-11-09", title: "Add report pdf and diagram png", url: "https://github.com/Orlands/snake-tj/pull/10" },
  { repo: "Orlands/snake-tj", date: "2015-11-09", title: "Add report pdf and diagram png", url: "https://github.com/Orlands/snake-tj/pull/11" },
  { repo: "Orlands/snake-tj", date: "2015-11-09", title: "Design documentation and code", url: "https://github.com/Orlands/snake-tj/pull/8" },
  { repo: "Orlands/snake-tj", date: "2015-11-09", title: "Design documentation and code", url: "https://github.com/Orlands/snake-tj/pull/9" },
  { repo: "Orlands/snake-tj", date: "2015-11-20", title: "Add headers", url: "https://github.com/Orlands/snake-tj/pull/12" },
  { repo: "pqvst/cafeandcowork", date: "2019-10-31", title: "Add place to work at paris", url: "https://github.com/pqvst/cafeandcowork/pull/1" },
  { repo: "pqvst/cafeandcowork", date: "2019-10-31", title: "Update paris.json", url: "https://github.com/pqvst/cafeandcowork/pull/2" },
  { repo: "pqvst/cafeandcowork", date: "2019-11-04", title: "Update paris.json", url: "https://github.com/pqvst/cafeandcowork/pull/3" },
  { repo: "pqvst/cafeandcowork", date: "2019-11-14", title: "Add \"Nuage Caf\u00e9\" on paris.json", url: "https://github.com/pqvst/cafeandcowork/pull/4" },
  { repo: "pqvst/cafeandcowork", date: "2019-11-28", title: "Update paris.json", url: "https://github.com/pqvst/cafeandcowork/pull/6" },
  { repo: "supasate/connected-react-router", date: "2019-10-06", title: "Add example for react native support", url: "https://github.com/supasate/connected-react-router/pull/350" },
  { repo: "supasate/connected-react-router", date: "2019-11-17", title: "fix(action): remove duplicate action key", url: "https://github.com/supasate/connected-react-router/pull/364" },
  { repo: "supasate/connected-react-router", date: "2019-11-17", title: "Update FAQ for react native example", url: "https://github.com/supasate/connected-react-router/pull/363" },
  { repo: "web-infra-dev/rspack", date: "2026-11-10", title: "fix(mf): keep the whole requiredVersion range in mf-manifest.json", url: "https://github.com/web-infra-dev/rspack/pull/16402" },
  { repo: "web-infra-dev/rspack", date: "2026-11-19", title: "fix(mf): match short caret and tilde ranges in the consume runtime", url: "https://github.com/web-infra-dev/rspack/pull/16663" },
  { repo: "XD2Sketch/react-oauth-popup", date: "2020-01-16", title: "feat(tick): use requestAnimationFrame instead of setInterval", url: "https://github.com/XD2Sketch/react-oauth-popup/pull/10" },
  { repo: "XD2Sketch/react-oauth-popup", date: "2020-06-18", title: "test: calls onClose when popup closed", url: "https://github.com/XD2Sketch/react-oauth-popup/pull/17" },
];

// Lines added and removed per PR, taken 2026-11-22. Used with the snapshot above.
const snapshotLines: Record<string, [number, number]> = {
  "https://github.com/web-infra-dev/rspack/pull/16402": [87, 18],
  "https://github.com/web-infra-dev/rspack/pull/16663": [52, 9],
  "https://github.com/module-federation/vite/pull/1579": [45, 2],
  "https://github.com/ohmyzsh/ohmyzsh/pull/9459": [14, 2],
  "https://github.com/DefinitelyTyped/DefinitelyTyped/pull/38356": [12, 3],
  "https://github.com/supasate/connected-react-router/pull/364": [0, 1],
  "https://github.com/maticzav/graphql-middleware/pull/321": [2, 2],
  "https://github.com/XD2Sketch/react-oauth-popup/pull/10": [99, 53],
  "https://github.com/XD2Sketch/react-oauth-popup/pull/17": [3, 8],
  "https://github.com/Cero-Studio/ReactNativeWheelPicker/pull/103": [10, 6],
};

// "fix(mf): keep the whole range" -> { kind: "Fix", title: "Keep the whole range" }
function describe(raw: string): { kind: string; title: string } {
  const types = raw.match(/^\[@types\/[^\]]+\]\s*(.*)$/);
  if (types) return { kind: "Types", title: cap(types[1]) };
  const cc = raw.match(/^(\w+)(?:\([^)]*\))?!?:\s*(.*)$/);
  const map: Record<string, string> = { feat: "Feature", fix: "Fix", perf: "Performance", refactor: "Refactor", test: "Test", docs: "Docs", chore: "Change" };
  if (cc) return { kind: map[cc[1].toLowerCase()] ?? "Change", title: cap(cc[2]) };
  return { kind: "Change", title: cap(raw) };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const brief = (text: string) =>
  text.replace(/\p{Extended_Pictographic}|\uFE0F|:[a-z_]+:/gu, "").trim().replace(/\s*\([^)]*\)/g, "").split(" | ")[0].split(/(?<=[.!])\s/)[0].replace(/[.!]$/, "").replace(/^A delightful community-driven framework/, "Framework").trim();

function rank(prs: RawPr[], repos: Record<string, RawRepo>): Project[] {
  const now = new Date().getFullYear();
  const byRepo = new Map<string, Change[]>();
  for (const pr of prs) {
    if (EXCLUDE.has(pr.repo.toLowerCase()) || TRIVIAL.test(pr.title) || !repos[pr.repo] || repos[pr.repo].stars < 50) continue;
    const d = describe(pr.title);
    if (d.kind === "Docs") continue;
    (byRepo.get(pr.repo) ?? byRepo.set(pr.repo, []).get(pr.repo)!).push({ ...d, year: Number(pr.date.slice(0, 4)), url: pr.url });
  }
  return [...byRepo]
    .map(([repo, changes]) => {
      changes.sort((a, b) => WEIGHT[b.kind] - WEIGHT[a.kind] || b.year - a.year);
      const substance = changes.slice(0, 2).reduce((n, c) => n + (WEIGHT[c.kind] ?? 1), 0);
      const latest = Math.max(...changes.map((c) => c.year));
      const score = substance * Math.log10(repos[repo].stars + 10) + Math.max(0, 4 - (now - latest));
      return { repo, about: repos[repo].about, stars: repos[repo].stars, changes, score };
    })
    .sort((a, b) => b.score - a.score);
}

const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-build" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function json(url: string) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export async function getContributions(): Promise<Contributions> {
  try {
    const publicOrgs = ((await json(`https://api.github.com/users/${USER}/orgs`)) as { login: string }[]).map((o) => o.login);
    const owners = [...new Set([USER, ...PRIVATE_ORGS, ...publicOrgs])].filter((o) => !KEEP.has(o.toLowerCase()));
    const excluded = owners.map((o) => `-user:${o}`).join(" ");
    const q = encodeURIComponent(`author:${USER} type:pr is:merged is:public ${excluded}`);
    const search = await json(`https://api.github.com/search/issues?q=${q}&per_page=100`);
    const prs: RawPr[] = (search.items as { repository_url: string; title: string; html_url: string; closed_at: string }[]).map((i) => ({
      repo: i.repository_url.replace("https://api.github.com/repos/", ""),
      title: i.title,
      url: i.html_url,
      date: i.closed_at,
    }));
    if (!prs.length) throw new Error("no pull requests");
    const names = [...new Set(prs.map((p) => p.repo))];
    const repos: Record<string, RawRepo> = {};
    // Only look up projects that have a substantive change: fewer API calls, same ranking.
    const substantive = names.filter((n) => !EXCLUDE.has(n.toLowerCase()) && prs.some((p) => p.repo === n && !TRIVIAL.test(p.title)));
    await Promise.all(substantive.map(async (n) => {
      const r = await json(`https://api.github.com/repos/${n}`);
      repos[n] = { stars: r.stargazers_count, about: brief(r.description ?? "") };
    }));
    const ownedRepo = (repo: string) => owners.some((o) => repo.toLowerCase().startsWith(`${o.toLowerCase()}/`));
    const rows = flatten(rank(prs.filter((p) => !ownedRepo(p.repo)), repos));
    // Lines changed per PR. A failed lookup falls back to the snapshot.
    await withLines(rows, async (c) => {
      const [, repo, n] = c.url.match(/github\.com\/(.+)\/pull\/(\d+)/)!;
      try { const pr = await json(`https://api.github.com/repos/${repo}/pulls/${n}`); return [pr.additions, pr.deletions]; }
      catch { return snapshotLines[c.url]; }
    });
    return { repos: byRepo(rows) };
  } catch (error) {
    console.warn(`[oss] using snapshot: ${(error as Error).message}`);
    const rows = flatten(rank(snapshotPrs, snapshotRepos));
    await withLines(rows, async (c) => snapshotLines[c.url]);
    return { repos: byRepo(rows) };
  }
}

// Every substantive change, one row per PR.
const flatten = (ranked: Project[]): Row[] =>
  ranked.flatMap((p) => p.changes.filter((c) => SHOWN.has(c.kind)).map((c) => ({ ...c, repo: p.repo, about: p.about, lines: 0 })));

async function withLines(rows: Row[], lookup: (c: Change) => Promise<[number, number] | undefined>) {
  await Promise.all(rows.map(async (r) => {
    const lines = await lookup(r);
    if (lines) { [r.added, r.removed] = lines; r.lines = lines[0] + lines[1]; }
  }));
}

// One entry per repo with its PRs and summed lines; largest total first, ties to the most recent.
function byRepo(rows: Row[]): RepoChanges[] {
  const map = new Map<string, Row[]>();
  for (const r of rows) (map.get(r.repo) ?? map.set(r.repo, []).get(r.repo)!).push(r);
  return [...map].map(([repo, prs]) => {
    prs.sort((a, b) => b.lines - a.lines || b.year - a.year);
    const plural: Record<string, string> = { Fix: "fixes", Feature: "features", Performance: "performance changes", Types: "type updates", Refactor: "refactors", Test: "tests" };
    const counts = new Map<string, number>();
    for (const p of prs) counts.set(p.kind, (counts.get(p.kind) ?? 0) + 1);
    const kinds = [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${n === 1 ? k.toLowerCase() : plural[k] ?? k.toLowerCase()}`).join(" · ");
    return {
      repo, prs, kinds,
      about: prs[0].about,
      added: prs.reduce((n, p) => n + (p.added ?? 0), 0),
      removed: prs.reduce((n, p) => n + (p.removed ?? 0), 0),
      lines: prs.reduce((n, p) => n + p.lines, 0),
    };
  }).sort((a, b) => b.lines - a.lines || Math.max(...b.prs.map((p) => p.year)) - Math.max(...a.prs.map((p) => p.year)));
}
