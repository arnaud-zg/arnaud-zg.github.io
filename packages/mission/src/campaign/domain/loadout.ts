// What the crates hold: a site's real stack, from its career, told in chapters.
export type Station = {
  readonly name: string;
  readonly start: string; // "YYYY-MM"
  readonly end?: string; // none: still there
  readonly stack?: string; // "TypeScript, React"
  readonly emoji?: string; // the mark of the place, as the journey shows it
};
// One crate: a technology, where it was used (with each place's mark), from which year to which
// (null: still in use).
export type Pickup = {
  readonly name: string;
  readonly places: readonly string[];
  readonly marks: readonly string[];
  readonly from: number;
  readonly to: number | null;
};
// A part of the career, told by one map: its title, one line, and its skills.
export type Chapter = {
  readonly title: string;
  readonly line: string;
  readonly pickups: readonly Pickup[];
};
// The stack, longest used first (months, summed over the places), then most recent, then in the
// order the latest place lists it. `now` closes a stay that has not ended.
export const pickupsOf = (stations: readonly Station[], limit = 10, now = new Date()): Pickup[] => {
  type Seen = {
    name: string;
    places: string[];
    marks: string[];
    from: number;
    to: number | null;
    months: number;
    pos: number;
  };
  const seen = new Map<string, Seen>();
  const year = (date: string) => Number(date.slice(0, 4));
  const month = (date: string) => year(date) * 12 + Number(date.slice(5, 7) || 1) - 1;
  const today = now.getFullYear() * 12 + now.getMonth();
  for (const s of [...stations].sort((a, b) => a.start.localeCompare(b.start))) {
    const to = s.end ? year(s.end) : null;
    const months = Math.max(1, (s.end ? month(s.end) : today) - month(s.start) + 1);
    const names = (s.stack ?? "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    names.forEach((name, pos) => {
      const key = name.toLowerCase();
      const known = seen.get(key);
      if (!known)
        return void seen.set(key, {
          name,
          places: [s.name],
          marks: s.emoji ? [s.emoji] : [],
          from: year(s.start),
          to,
          months,
          pos,
        });
      if (!known.places.includes(s.name)) {
        known.places.push(s.name);
        if (s.emoji) known.marks.push(s.emoji);
      }
      known.to = known.to === null || to === null ? null : Math.max(known.to, to);
      known.months += months;
      known.pos = pos;
    });
  }
  const recency = (p: Seen) => p.to ?? Number.POSITIVE_INFINITY;
  return [...seen.values()]
    .sort((a, b) => b.months - a.months || recency(b) - recency(a) || a.pos - b.pos)
    .slice(0, limit)
    .map(({ name, places, marks, from, to }) => ({ name, places, marks, from, to }));
};
