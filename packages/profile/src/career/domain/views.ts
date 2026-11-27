import type { Position } from "./Position.ts";

export const roleOf = (position: Position) => {
  const { name, industry, emoji, motion, note, highlights, stack } = position.describe();
  const { start, end } = position.years();
  return {
    company: name,
    industry,
    emoji,
    motion,
    ...position.span(),
    titles: position.titles(),
    dates: `${start} → ${end ?? "now"}`,
    now: position.isCurrent(),
    highlights: [...(highlights ?? (note ? [note] : []))],
    stack,
  };
};

export const stintOf = (position: Position) => {
  const { name, role, emoji, motion, note = "" } = position.describe();
  return {
    company: name,
    role,
    emoji,
    motion,
    ...position.span(),
    year: position.years().start,
    note,
  };
};
