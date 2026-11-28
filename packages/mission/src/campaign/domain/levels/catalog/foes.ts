// Every kind of foe a level may send, and what it is worth.
import type { FoeKind } from "../../map.ts";

export type FoeSpec = {
  readonly width: number;
  readonly height: number;
  readonly health: number;
  readonly toughens: boolean; // grows tougher with the heat (director.ts, toughen)
  readonly points: number; // for a kill, before the chain multiplies it
};

export const FOES = {
  bug: { width: 10, height: 6, health: 1, toughens: false, points: 100 },
  robot: { width: 14, height: 16, health: 3, toughens: true, points: 300 },
  drone: { width: 14, height: 6, health: 3, toughens: true, points: 400 },
} as const satisfies { [K in FoeKind]: FoeSpec };
