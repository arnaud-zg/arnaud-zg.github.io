// Agent skills: read at build time from the "Available skills" table in the skills repo's
// README, so a new skill shows up on the next build. The table pairs what you want to do
// with the skill that does it, which is the copy the page uses.

import config from "../../portfolio.config";

export type Skill = { name: string; use: string; href: string };

const { repo } = config.skills;
const blob = (path: string) => `https://github.com/${repo}/blob/HEAD/${path.replace(/^\.\//, "")}`;

// Snapshot taken 2026-11-23, used when GitHub is unreachable.
const snapshot: Skill[] = [
  { name: "hexagonal-skill-builder", use: "Write an Agent Skill and lint it", href: blob("plugins/arnaud-zg/docs/hexagonal-skill-builder/README.md") },
  { name: "hexagonal-architecture", use: "Keep a codebase's core free of its database and tools: hexagonal, clean architecture", href: blob("plugins/arnaud-zg/docs/hexagonal-architecture/README.md") },
  { name: "doc-compass", use: "Write and check Diataxis docs, with examples a test runs", href: blob("plugins/arnaud-zg/docs/doc-compass/README.md") },
  { name: "testing-trophy", use: "Plan, write or audit tests: mostly integration, a few unit and end to end", href: blob("plugins/arnaud-zg/docs/testing-trophy/README.md") },
  { name: "big-o-optimizer", use: "Lower the Big O of slow code, O(n²) to O(n), proven by your tests", href: blob("plugins/arnaud-zg/docs/big-o-optimizer/README.md") },
  { name: "radical-simplify", use: "Cut a process, product or UI down to its simplest version", href: blob("plugins/arnaud-zg/docs/radical-simplify/README.md") },
  { name: "glance-first", use: "Turn any work into a one-minute read: TLDR, key numbers, one diagram per point", href: blob("plugins/arnaud-zg/docs/glance-first/README.md") },
  { name: "glance-audit", use: "Get a sceptical review of a doc, plan or PR, with comments ready to paste", href: blob("plugins/arnaud-zg/docs/glance-audit/README.md") },
  { name: "plain-language", use: "Write any output in plain language, after Simplified Technical English (STE)", href: blob("plugins/arnaud-zg/docs/plain-language/README.md") },
  { name: "skill-retro", use: "After a session, find what made the skills slow or costly and fix them", href: blob("plugins/arnaud-zg/docs/skill-retro/README.md") },
  { name: "usage-runway", use: "Check if the next job fits in your Claude usage window: GO or PARK", href: blob("plugins/arnaud-zg/docs/usage-runway/README.md") },
  { name: "stack-and-ship", use: "Commit, open and stack pull requests by your project's rules, never force-pushing", href: blob("plugins/arnaud-zg/docs/stack-and-ship/README.md") },
];

// Rows look like: | Write an Agent Skill and lint it | [`hexagonal-skill-builder`](./plugins/...) |
const ROW = /^\|\s*(.+?)\s*\|\s*\[`([^`]+)`\]\(([^)]+)\)/;

export async function getSkills(): Promise<Skill[]> {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/README.md`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(String(res.status));
    const skills = (await res.text()).split("\n").flatMap((line) => {
      const m = line.match(ROW);
      return m ? [{ name: m[2], use: m[1], href: m[3].startsWith("http") ? m[3] : blob(m[3]) }] : [];
    });
    if (!skills.length) throw new Error("no skills table");
    return skills;
  } catch (error) {
    console.warn(`[skills] using snapshot: ${(error as Error).message}`);
    return snapshot;
  }
}
