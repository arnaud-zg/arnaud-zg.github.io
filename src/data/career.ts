// Career timeline and tenure numbers, computed from portfolio.config.ts at build time.
// Positions are percentages of the span from the first start to the current month, so
// each segment's width is the time spent there.

import config, { type Station, type StackRange } from "../../portfolio.config";

const { stations, stack, school, types } = config.career;

const toMonth = (ym: string) => { const [y, m] = ym.split("-").map(Number); return y * 12 + (m - 1); };
const now = new Date();
const NOW = now.getUTCFullYear() * 12 + now.getUTCMonth();
const START = Math.min(...stations.map((s) => toMonth(s.start)));
const SPAN = NOW + 1 - START;
// Months spent, counting both the first and the last month, as LinkedIn does.
const months = (s: { start: string; end?: string }) => (s.end ? toMonth(s.end) : NOW) - toMonth(s.start) + 1;
const pos = (s: { start: string; end?: string }) => ({
  left: ((toMonth(s.start) - START) / SPAN) * 100,
  width: (months(s) / SPAN) * 100,
});

export type Segment = Station & { left: number; width: number; months: number; now: boolean; marks: { at: number; label: string }[] };
export type Lane = StackRange & { left: number; width: number };

const segments: Segment[] = stations.map((s) => ({
  ...s,
  ...pos(s),
  months: months(s),
  now: !s.end,
  // Milestones as a percentage across the segment.
  marks: (s.milestones ?? []).map((m) => ({ label: m.label, at: ((toMonth(m.at) - toMonth(s.start)) / months(s)) * 100 })),
}));

const lanes: Lane[] = stack.map((l) => ({ ...l, ...pos(l) }));

// Year ticks across the bar.
const firstYear = Math.floor(START / 12), lastYear = Math.floor(NOW / 12);
const ticks = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i)
  .map((y) => ({ year: y, left: ((y * 12 - START) / SPAN) * 100 }))
  .filter((t) => t.left >= 0);

// School band: from the first stint to the end of the last part-time one.
const partTime = stations.filter((s) => !s.fullTime);
const schoolBand = partTime.length
  ? { label: school.label, ...pos({ start: partTime[0].start, end: partTime[partTime.length - 1].end }) }
  : null;

// Tenure, over completed full-time roles only: the current one is still running.
const done = stations.filter((s) => s.fullTime && s.end).map(months);
const longest = Math.max(...stations.filter((s) => s.fullTime).map(months));

export const career = {
  segments,
  lanes,
  ticks,
  schoolBand,
  types: Object.entries(types).filter(([t]) => stations.some((s) => s.type === t)),
  years: lastYear - firstYear,
  longestYears: Math.round(longest / 12),
  averageYears: done.length ? Math.round(done.reduce((a, b) => a + b, 0) / done.length / 12) : 0,
};

export const formatSpan = (m: number) => {
  const y = Math.floor(m / 12), r = m % 12;
  return [y && `${y} yr${y > 1 ? "s" : ""}`, r && `${r} mo${r > 1 ? "s" : ""}`].filter(Boolean).join(" ");
};
