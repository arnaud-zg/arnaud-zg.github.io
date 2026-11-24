// Career, shaped for how a recruiter reads it: a summary first (current role, experience,
// seniority, industries), then one card per full-time role, newest first, and
// the early part-time stints folded into a single line. Everything is computed from
// portfolio.config.ts at build time.

import config, { type Station } from "../../portfolio.config";

const { stations, school, education } = config.career;

const toMonth = (ym: string) => { const [y, m] = ym.split("-").map(Number); return y * 12 + (m - 1); };
const now = new Date();
const NOW = now.getUTCFullYear() * 12 + now.getUTCMonth();
// Months spent, counting both the first and the last month, as LinkedIn does.
const months = (s: { start: string; end?: string }) => (s.end ? toMonth(s.end) : NOW) - toMonth(s.start) + 1;


export type Role = {
  company: string; industry?: string;
  titles: { title: string; since?: string }[];
  dates: string; now: boolean;
  highlights: string[]; stack: string[];
};
export type Stint = { company: string; role: string; year: string; note: string };

const fullTime = stations.filter((s) => s.fullTime);
const partTime = stations.filter((s) => !s.fullTime);

const roles: Role[] = [...fullTime].reverse().map((s: Station) => ({
  company: s.name,
  industry: s.industry,
  // Title progression: the starting title, then each promotion with its year.
  titles: [{ title: s.role }, ...(s.milestones ?? []).filter((m) => m.title).map((m) => ({ title: m.title!, since: m.at.slice(0, 4) }))],
  dates: `${s.start.slice(0, 4)} → ${s.end ? s.end.slice(0, 4) : "now"}`,
  now: !s.end,
  highlights: s.highlights ?? (s.note ? [s.note] : []),
  stack: s.stack.split(", "),
}));

const early = {
  title: school.name,
  role: school.role,
  years: partTime.length ? `${partTime[0].start.slice(0, 4)}–${(partTime[partTime.length - 1].end ?? "").slice(0, 4)}` : "",
  // Newest first, like the role cards above.
  stints: [...partTime].reverse().map((s) => ({ company: s.name, role: s.role, year: s.start.slice(0, 4), note: s.note ?? "" })) as Stint[],
};

// Summary facts. Experience counts full-time roles only, not the internships.
const firstYear = Math.floor(Math.min(...fullTime.map((s) => toMonth(s.start))) / 12);
const lastYear = Math.floor(NOW / 12);
const longest = Math.max(...fullTime.map(months));
const current = fullTime.find((s) => !s.end) ?? fullTime[fullTime.length - 1];
const seniorSince = fullTime.flatMap((s) => s.milestones ?? []).find((m) => /senior/i.test(m.title ?? m.label))?.at.slice(0, 4);
const industries = [...new Set(fullTime.slice().reverse().map((s) => s.industry).filter(Boolean))] as string[];

export const career = {
  roles,
  education,
  early,
  summary: { role: current.role, company: current.name, seniorSince, industries, education: education.find((e) => e.short)?.short },
  years: lastYear - firstYear,
  longestYears: Math.round(longest / 12),
};
