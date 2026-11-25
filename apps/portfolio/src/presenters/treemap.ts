// Places the quest groups in the design's treemap: groups share the box, tools share their group.
import type { Group } from "@arnaud-zg/design/treemap";
import { TREEMAP_BOX as BOX, squarify } from "@arnaud-zg/design/treemap";

import type { profile } from "../profile";

type QuestGroups = ReturnType<typeof profile.sideQuests>["groups"];

// One group's box on phones, in arbitrary units.
const PHONE = { w: 16, h: 10 };

export const treemapOf = (groups: QuestGroups): Group[] => {
  const weights = groups.map(({ tiles }) => tiles.map(({ weight }) => weight));
  const totals = weights.map((own) => own.reduce((total, weight) => total + weight, 0));
  const boxes = squarify(totals, BOX.w, BOX.h, true);
  return groups.map(({ name, emoji, tiles }, index) => {
    const rect = boxes[index];
    const wide = squarify(weights[index], (rect.w / 100) * BOX.w, (rect.h / 100) * BOX.h, true);
    const phone = squarify(weights[index], PHONE.w, PHONE.h, true);
    const placed = tiles.map((tile, at) => ({ ...tile, rect: wide[at], mrect: phone[at] }));
    return { name, emoji, rect, tiles: placed };
  });
};
