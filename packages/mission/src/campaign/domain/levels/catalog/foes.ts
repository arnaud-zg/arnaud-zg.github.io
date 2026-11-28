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

// Light mode is office hours, dark mode the night shift: same foes, other clothes, other traits.
export type Shift = "light" | "dark";
export type FoeLook = "ticket" | "race" | "reorg" | "zombie" | "invite" | "pager";
// busy: no gun for a moment; blink: in two places; fast: quicker; undead: up again, but kill -9.
export type Trait = "busy" | "blink" | "fast" | "undead" | "none";
export type Skin = { readonly name: string; readonly look: FoeLook; readonly trait: Trait };

export const ROSTERS = {
  light: {
    bug: { name: "JIRA TICKET", look: "ticket", trait: "none" },
    robot: { name: "REORG ROBOT", look: "reorg", trait: "none" },
    drone: { name: "MEETING INVITE", look: "invite", trait: "busy" },
  },
  dark: {
    bug: { name: "RACE CONDITION", look: "race", trait: "blink" },
    robot: { name: "ZOMBIE PROCESS", look: "zombie", trait: "undead" },
    drone: { name: "3 AM PAGER", look: "pager", trait: "fast" },
  },
} as const satisfies { [S in Shift]: { [K in FoeKind]: Skin } };
