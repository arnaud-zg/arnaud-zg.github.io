// What a mission map is: one data file per level in levels/ (see its README), read by the engine.
//
// Units: stage pixels (the canvas is drawn small and scaled up), seconds, and heights measured up
// from the ground. `at` is where the right edge of the camera must reach for an event to fire.

import type { Mechanic } from "../../combat/domain/bosses.ts";
import type { WeaponId } from "../../combat/domain/weapons.ts";
import type { ColleagueId } from "./levels/catalog/colleagues.ts";
import type { ExerciseId } from "./levels/catalog/exercises.ts";
import type { INCIDENTS } from "./levels/catalog/incidents.ts";
import type { PropId } from "./levels/catalog/items.ts";

type IncidentId = keyof typeof INCIDENTS;

export type FoeKind = "bug" | "robot" | "drone";

export type Spawn = {
  readonly foe: FoeKind;
  readonly n?: number; // how many, `gap` seconds apart (1)
  readonly gap?: number;
  readonly delay?: number; // seconds before the first
  readonly from?: "right" | "left"; // left: an ambush from behind
};

export type MapEvent =
  // A crate on the ground, or on a ledge `h` high. It holds the next skill and a weapon.
  | { readonly at: number; readonly kind: "crate"; readonly x: number; readonly h?: number }
  // A teammate held captive; shoot them free for a gift.
  | {
      readonly at: number;
      readonly kind: "mate";
      readonly x: number;
      readonly h?: number;
      readonly gift: "bombs" | "life";
    }
  // Foes walking or flying in, the camera free.
  | { readonly at: number; readonly kind: "spawn"; readonly spawn: Spawn }
  // The camera stops with its right edge on `x` until the wave, its parachuted crates and its
  // turret are down.
  | {
      readonly at: number;
      readonly kind: "lock";
      readonly x: number;
      readonly wave: readonly Spawn[];
      readonly chutes?: number;
      readonly turret?: number; // where the mid-boss stands; it drops two crates
    }
  // A whiteboard at `x`: walking into it opens an exercise or a design decision (catalog/exercises.ts).
  | { readonly at: number; readonly kind: "exercise"; readonly x: number; readonly id: ExerciseId }
  // Production breaks at `at`; with `x`, a hotfix kiosk instead, open only while still degraded.
  | { readonly at: number; readonly kind: "incident"; readonly id: IncidentId; readonly x?: number }
  // A colleague at `x` (catalog/colleagues.ts): a review, nits, or a change of scope mid-fight.
  | {
      readonly at: number;
      readonly kind: "colleague";
      readonly id: ColleagueId;
      readonly x: number;
    }
  // Something lying on the ground at `x`, to grab, throw or use (catalog/items.ts).
  | { readonly at: number; readonly kind: "prop"; readonly id: PropId; readonly x: number }
  // From `from` to `to`, the hero's gun is the CI cannon, and every shot waits for its build.
  | { readonly at: number; readonly kind: "loop"; readonly from: number; readonly to: number }
  // The end: a warning, then the boss, in the last screen of the map. Drops one crate.
  | { readonly at: number; readonly kind: "boss" };

// What the boss does: hop (a shockwave runs along the ground, jump it), volley (projectiles in
// arcs), sweepLow (a beam at the waist, crouch under it), sweepHigh (at the head, stay down),
// spawn (bugs).
export type Attack = "hop" | "volley" | "sweepLow" | "sweepHigh" | "spawn";
export type BossArt = "monolith" | "tree" | "tank";
export type Boss = {
  readonly name: string;
  readonly art: BossArt;
  readonly hp: number;
  // From full health down; a phase starts once health falls to `below` (1, then lower).
  readonly phases: readonly {
    readonly below: number;
    readonly attacks: readonly Attack[];
    readonly rest: number;
  }[];
  readonly split: string; // shouted when it falls
  readonly mechanic: Mechanic; // how it really falls (combat/domain/bosses.ts)
};

export type Layer = {
  readonly kind: "dunes" | "hills" | "canopy" | "sea" | "skyline";
  readonly color: string;
  readonly alpha: number;
  readonly parallax: number; // 0 stays put, 1 moves with the ground
  readonly base: number; // height above the ground line
  readonly amp: number;
  readonly seed: number;
};
export type PropKind = "rack" | "palm" | "tree" | "arch" | "wreck" | "buoy" | "reeds";

export type Theme = {
  readonly dim: string; // laid over the page, under the stage
  readonly ground: {
    readonly base: string;
    readonly light: string;
    readonly dark: string;
    readonly speck: string;
  };
  readonly ledge: "plank" | "stone" | "pier";
  readonly layers: readonly Layer[];
  readonly bug: readonly [string, string];
  readonly robot: readonly [string, string, string]; // body, light, dark
  readonly sweep: readonly [string, string]; // the boss's beam: core, edge
  readonly volley: readonly [string, string];
  readonly debris: readonly string[]; // what the boss breaks into
  readonly plate: readonly [string, string, string]; // the title plate and the select cards: base, light, dark
  readonly menu: string; // the intro's own backdrop
};

export type MissionMap = {
  readonly id: string;
  readonly rarity: Rarity; // how often the clock brings it (see levels/index.ts)
  readonly title: string;
  readonly time: string; // the hour it plays at, said on the briefing
  readonly briefing: readonly string[];
  readonly warning: string;
  readonly length: number;
  readonly par: number; // seconds a good run takes, for the review's lead time
  // The weapons this map unlocks, handed out in turn by its crates, one per skill.
  readonly loot: readonly WeaponId[];
  readonly theme: Theme;
  readonly music: { readonly riff: readonly number[]; readonly step: number }; // MIDI notes, 0 rests
  readonly platforms: readonly { readonly x: number; readonly h: number; readonly w: number }[];
  readonly props: readonly { readonly kind: PropKind; readonly x: number }[];
  readonly turret: { readonly name: string; readonly hp: number };
  readonly boss: Boss;
  readonly events: readonly MapEvent[];
};

// The crates a map holds: one per crate and parachute, two per turret, one for the boss.
export const crateSlots = (map: MissionMap) =>
  map.events.reduce(
    (n, e) =>
      n +
      (e.kind === "crate" || e.kind === "boss"
        ? 1
        : e.kind === "lock"
          ? (e.chutes ?? 0) + (e.turret === undefined ? 0 : 2)
          : 0),
    0,
  );

// Which map the clock picks. Each map has a rarity; the minute decides, the same for everyone
// in that minute. Some minutes always bring a given rarity (13:37, say); the others draw one at
// the odds below, from a hash of the date and the minute. The visitor never chooses.
export type Rarity = "common" | "special" | "rare";
export type Odds = Readonly<Record<Rarity, number>>; // shares, summing to 1
export type Moment = { readonly at: string; readonly rarity: Rarity; readonly note: string }; // "13:37", or "*:42" for every hour
export type Pick = { readonly map: MissionMap; readonly note?: string };

const pad = (n: number) => String(n).padStart(2, "0");
// A number in [0, 1) from a text: FNV-1a, then a final mix.
const unit = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  // A final mix, so that neighbouring minutes land far apart.
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
};

export const pickMap = (
  maps: readonly MissionMap[],
  odds: Odds,
  moments: readonly Moment[],
  date: Date,
): Pick => {
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const moment = moments.find((m) => m.at === hm || m.at === `*:${hm.slice(3)}`);
  const roll = unit(
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${hm}`,
  );
  const rarity: Rarity =
    moment?.rarity ??
    (roll < odds.rare ? "rare" : roll < odds.rare + odds.special ? "special" : "common");
  const map = maps.find((m) => m.rarity === rarity) ?? maps.at(0);
  if (!map) throw new Error("No mission map");
  return moment ? { map, note: moment.note } : { map };
};

// The whole campaign: the clock's pick first, then the others drawn in turn at their odds, so
// the rare one tends to come last. Finishing a map, at any rank, unlocks the next.
export const orderMaps = (
  maps: readonly MissionMap[],
  odds: Odds,
  moments: readonly Moment[],
  date: Date,
): MissionMap[] => {
  const first = pickMap(maps, odds, moments, date).map;
  const rest = maps.filter((m) => m !== first);
  const order = [first];
  for (let i = 1; rest.length; i++) {
    const total = rest.reduce((n, m) => n + odds[m.rarity], 0);
    let roll = unit(`${date.toISOString().slice(0, 16)}#${i}`) * total;
    const next = rest.find((m) => (roll -= odds[m.rarity]) < 0) ?? rest.at(-1);
    if (!next) break;
    order.push(next);
    rest.splice(rest.indexOf(next), 1);
  }
  return order;
};
