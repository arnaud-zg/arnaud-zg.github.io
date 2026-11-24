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
import { fallback } from "../lib/fallback";
import saved from "./snapshots/github.json";

const USER = config.github.user;
// Never count work on my own account or on organisations I run (see portfolio.config.ts).
const PRIVATE_ORGS: readonly string[] = config.github.ownOrgs;
const KEEP = new Set(config.github.keepOrgs.map((o) => o.toLowerCase()));
const EXCLUDE = new Set(config.github.excludeRepos.map((r) => r.toLowerCase()));
// Only changes that say something about the work: no chores, docs or bare "Update X".
const SHOWN = new Set<string>(config.github.shownKinds);
const TRIVIAL = config.github.trivial;
const WEIGHT: Record<string, number> = config.github.weights;

type RawPr = { repo: string; title: string; url: string; date: string };
type RawRepo = { stars: number; about: string };
type Saved = { prs: RawPr[]; repos: Record<string, RawRepo>; lines: Record<string, readonly [number, number] | undefined> };
const savedData = saved as unknown as Saved;


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
    if (EXCLUDE.has(pr.repo.toLowerCase()) || TRIVIAL.test(pr.title) || !repos[pr.repo] || repos[pr.repo].stars < config.github.minStars) continue;
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
// GH_TOKEN is what shiplane passes on GitHub Actions.
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (token) headers.Authorization = `Bearer ${token}`;
async function json(url: string) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export async function fetchGithub(): Promise<Saved> {
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
  // Only look up projects that have a substantive change: fewer API calls, same ranking.
  const substantive = names.filter((n) => !EXCLUDE.has(n.toLowerCase()) && prs.some((p) => p.repo === n && !TRIVIAL.test(p.title)));
  const repos: Record<string, RawRepo> = Object.fromEntries(await Promise.all(substantive.map(async (n) => {
    const r = await json(`https://api.github.com/repos/${n}`);
    return [n, { stars: r.stargazers_count, about: brief(r.description ?? "") }];
  })));
  const ownedRepo = (repo: string) => owners.some((o) => repo.toLowerCase().startsWith(`${o.toLowerCase()}/`));
  const others = prs.filter((p) => !ownedRepo(p.repo));
  // Lines changed per PR shown. A failed lookup falls back to the snapshot.
  const lines = await Promise.all(flatten(rank(others, repos)).map(async ({ url }) => {
    const [, repo, n] = url.match(/github\.com\/(.+)\/pull\/(\d+)/)!;
    try { const pr = await json(`https://api.github.com/repos/${repo}/pulls/${n}`); return [url, [pr.additions, pr.deletions]] as const; }
    catch (error) { return [url, fallback("github", error, savedData.lines[url])] as const; }
  }));
  return { prs: others, repos, lines: Object.fromEntries(lines) };
}

export async function getContributions(): Promise<Contributions> {
  const { prs, repos, lines } = await fetchGithub().catch((error) => fallback("github", error, savedData));
  const rows = flatten(rank(prs, repos)).map((r) => {
    const [added, removed] = lines[r.url] ?? [];
    return added === undefined || removed === undefined ? r : { ...r, added, removed, lines: added + removed };
  });
  return { repos: byRepo(rows) };
}

// Every substantive change, one row per PR.
const flatten = (ranked: Project[]): Row[] =>
  ranked.flatMap((p) => p.changes.filter((c) => SHOWN.has(c.kind)).map((c) => ({ ...c, repo: p.repo, about: p.about, lines: 0 })));

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
