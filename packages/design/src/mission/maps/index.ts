// The maps, in the story's order: map 1 tells the site's first chapter, map 2 the second, map 3
// the third. Which one plays is the clock's call (see pickMap): the visitor never chooses.
import type { MissionMap, Moment, Odds } from "../map";
import { deepDive } from "./deep-dive.ts";
import { greenfield } from "./greenfield.ts";
import { shipIt } from "./ship-it.ts";

export const MAPS: readonly MissionMap[] = [greenfield, shipIt, deepDive];

// Most minutes bring the common map, some the special one, a few the super rare one.
export const ODDS: Odds = { common: 0.75, special: 0.2, rare: 0.05 };

// Minutes a nerd would know: they always bring the same rarity, and say why.
export const MOMENTS: readonly Moment[] = [
  { at: "13:37", rarity: "rare", note: "13:37 · LEET O'CLOCK" },
  { at: "04:04", rarity: "rare", note: "04:04 · MAP NOT FOUND, YET HERE IT IS" },
  { at: "03:14", rarity: "special", note: "03:14 · PI TIME" },
  { at: "*:42", rarity: "special", note: "THE ANSWER TO EVERYTHING" },
];
