import type { Position } from "./Position.ts";

export const roleOf = (position: Position) => {
  const { name, industry, note, highlights, stack } = position.describe();
  const { start, end } = position.years();
  return {
    company: name,
    industry,
    titles: position.titles(),
    dates: `${start} → ${end ?? "now"}`,
    now: position.isCurrent(),
    highlights: [...(highlights ?? (note ? [note] : []))],
    stack,
  };
};

export const stintOf = (position: Position) => {
  const { name, role, note = "" } = position.describe();
  return { company: name, role, year: position.years().start, note };
};
