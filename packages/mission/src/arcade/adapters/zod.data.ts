// The page's text is checked once, here; unknown words are dropped, missing ones keep their default.
import * as z from "zod/mini"; // the small build: the schema loads with the game, not the page

import type { MissionLabels } from "../domain/labels.ts";
import type { MissionData } from "../domain/mission.ts";
import { missionLabels } from "../domain/labels.ts";

const pickup = z.object({
  name: z.string(),
  places: z.array(z.string()),
  marks: z.array(z.string()),
  from: z.number(),
  to: z.nullable(z.number()),
});
const chapter = z.object({ title: z.string(), line: z.string(), pickups: z.array(pickup) });
const data = z.object({
  chapters: z.array(chapter),
  labels: z.record(z.string(), z.string()),
  contact: z.optional(z.object({ href: z.string(), label: z.string() })),
});

const isLabel = (key: string): key is keyof MissionLabels => Object.hasOwn(missionLabels, key);

const labelsOf = (given: Record<string, string>): MissionLabels => ({
  ...missionLabels,
  ...Object.fromEntries(Object.entries(given).filter(([key]) => isLabel(key))),
});

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

export const missionDataOf = (text: string): MissionData | undefined => {
  const parsed = data.safeParse(parseJson(text));
  if (!parsed.success) return undefined;
  const { chapters, labels, contact } = parsed.data;
  return { chapters, labels: labelsOf(labels), ...(contact ? { contact } : {}) };
};
