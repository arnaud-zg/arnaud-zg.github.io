// Agent skills: read at build time from the "Available skills" table in the skills repo's
// README, so a new skill shows up on the next build. The table pairs what you want to do
// with the skill that does it, which is the copy the page uses.

import config from "../../portfolio.config";
import { fallback } from "../lib/fallback";
import saved from "./snapshots/skills.json";

export type Skill = { name: string; use: string; href: string };

const { repo } = config.skills;
const blob = (path: string) => `https://github.com/${repo}/blob/HEAD/${path.replace(/^\.\//, "")}`;

// Rows look like: | Write an Agent Skill and lint it | [`hexagonal-skill-builder`](./plugins/...) |
const ROW = /^\|\s*(.+?)\s*\|\s*\[`([^`]+)`\]\(([^)]+)\)/;

export async function fetchSkills(): Promise<Skill[]> {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/README.md`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(String(res.status));
  const skills = (await res.text()).split("\n").flatMap((line) => {
    const m = line.match(ROW);
    return m ? [{ name: m[2], use: m[1], href: m[3].startsWith("http") ? m[3] : blob(m[3]) }] : [];
  });
  if (!skills.length) throw new Error("no skills table");
  return skills;
}

export const getSkills = (): Promise<Skill[]> =>
  fetchSkills().catch((error) => fallback<Skill[]>("skills", error, saved));
