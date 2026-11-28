// What a site hands the arcade: its chapters, its words, and how to reach it.
import type { Chapter } from "../../campaign/domain/loadout.ts";
import type { MissionLabels } from "./labels.ts";

export type MissionData = {
  readonly chapters: readonly Chapter[];
  readonly labels: MissionLabels;
  readonly contact?: { readonly href: string; readonly label: string };
  // Where the site keeps its light or dark theme: an attribute on <html>, and a storage key.
  readonly theme?: { readonly attribute: string; readonly storageKey: string };
};
