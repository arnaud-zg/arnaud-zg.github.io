// Career table and tenure numbers, computed from portfolio.config.ts at build time.
// Each row carries range bars positioned on one shared axis, from the first start to the
// current month, so a bar's position and length are its real dates.

import config, { type CompanyType, type Station } from "../../portfolio.config";

const { stations, school, types } = config.career;

const toMonth = (ym: string) => { const [y, m] = ym.split("-").map(Number); return y * 12 + (m - 1); };
const now = new Date();
const NOW = now.getUTCFullYear() * 12 + now.getUTCMonth();
const START = Math.min(...stations.map((s) => toMonth(s.start)));
const SPAN = NOW + 1 - START;
// Months spent, counting both the first and the last month, as LinkedIn does.
const months = (s: { start: string; end?: string }) => (s.end ? toMonth(s.end) : NOW) - toMonth(s.start) + 1;
const at = (ym: string) => ((toMonth(ym) - START) / SPAN) * 100;

export type Bar = { name: string; type: CompanyType; left: number; width: number; now: boolean };
export type Row = { name: string; role: string; span: string; note: string; stack: string; type?: CompanyType; bars: Bar[]; marks: { left: number; label: string }[] };

export const formatSpan = (m: number) => {
  const y = Math.floor(m / 12), r = m % 12;
  return [y && `${y} yr${y > 1 ? "s" : ""}`, r && `${r} mo${r > 1 ? "s" : ""}`].filter(Boolean).join(" ");
};
const bar = (s: Station): Bar => ({ name: s.name, type: s.type, left: at(s.start), width: (months(s) / SPAN) * 100, now: !s.end });

// Full-time roles get a row each, newest first; part-time stints fold into one school row.
const fullTime = stations.filter((s) => s.fullTime);
const partTime = stations.filter((s) => !s.fullTime);
const rows: Row[] = [
  ...[...fullTime].reverse().map((s) => ({
    name: s.name,
    role: s.role,
    span: `${s.start.slice(0, 4)} · ${s.end ? formatSpan(months(s)) : `${formatSpan(months(s))}, now`}`,
    note: s.note,
    stack: s.stack,
    type: s.type,
    bars: [bar(s)],
    marks: (s.milestones ?? []).map((m) => ({ left: at(m.at), label: m.label })),
  })),
  ...(partTime.length
    ? [{
        name: school.name,
        role: school.role,
        span: `${partTime[0].start.slice(0, 4)}–${(partTime[partTime.length - 1].end ?? "").slice(0, 4)} · ${partTime.map((s) => s.name).join(", ")}`,
        note: school.note,
        stack: [...new Set(partTime.flatMap((s) => s.stack.split(", ")))].join(", "),
        bars: partTime.map(bar),
        marks: [],
      }]
    : []),
];

// Year ticks on the shared axis: every third year, so labels never crowd the narrow column.
const firstYear = Math.floor(START / 12), lastYear = Math.floor(NOW / 12);
const ticks = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i)
  .filter((y) => y > firstYear && (y - firstYear) % 3 === 0)
  .map((y) => ({ year: y, left: ((y * 12 - START) / SPAN) * 100 }));

// Tenure, over completed full-time roles only: the current one is still running.
const done = fullTime.filter((s) => s.end).map(months);
const longest = Math.max(...fullTime.map(months));

export const career = {
  rows,
  ticks,
  types: Object.entries(types).filter(([t]) => stations.some((s) => s.type === t)),
  years: lastYear - firstYear,
  longestYears: Math.round(longest / 12),
  averageYears: done.length ? Math.round(done.reduce((a, b) => a + b, 0) / done.length / 12) : 0,
};
