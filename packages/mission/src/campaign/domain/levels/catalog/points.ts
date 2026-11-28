// What everything besides a kill is worth (a kill: foes.ts).
import type { Weights } from "../../../../combat/domain/score.ts";

export const POINTS = {
  crate: 200,
  weapon: 500,
  mate: 1000,
  turret: 5000,
  boss: 20000,
  bossHit: 20, // per point of damage
  melee: 2, // a kill up close counts this many times
} as const;

// What the review after each map pays for (combat/domain/score.ts, reviewOf).
export const TALLY = {
  coverage: { floor: 0.3, perPoint: 40 }, // per point of accuracy above 30%
  incidents: 5000, // halved by each death
  leadTime: 3000, // in full at the level's par time, none at twice it
  knowledge: { perSkill: 300, all: 1.5 }, // every skill of the map: times 1.5
  combo: 250, // per kill of the best chain
  interest: { perDebt: 400, compound: 1.25 }, // charged per point of debt, compounding per map
} as const satisfies Weights;
