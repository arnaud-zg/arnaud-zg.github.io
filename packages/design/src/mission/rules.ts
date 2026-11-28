// The mission's rules, apart from the screen: the weapons, the score chain and the rank.

export type WeaponId = "pistol" | "rapid" | "spread" | "rocket" | "flame";
export type Weapon = {
  readonly letter: string; // stencilled on the crate and shown in the HUD
  readonly cooldown: number; // seconds between shots
  readonly ammo: number; // shots in a pickup; the pistol never runs dry
  readonly damage: number; // per hit
  readonly speed: number; // stage pixels per second
  readonly pellets: number;
  readonly spread: number; // radians either side
  readonly life: number; // seconds a shot flies
};

export const WEAPONS: Record<WeaponId, Weapon> = {
  pistol: {
    letter: "P",
    cooldown: 0.2,
    ammo: Infinity,
    damage: 1,
    speed: 320,
    pellets: 1,
    spread: 0,
    life: 1.1,
  },
  rapid: {
    letter: "R",
    cooldown: 0.065,
    ammo: 180,
    damage: 1,
    speed: 360,
    pellets: 1,
    spread: 0.07,
    life: 1.1,
  },
  spread: {
    letter: "S",
    cooldown: 0.42,
    ammo: 28,
    damage: 1.6,
    speed: 290,
    pellets: 5,
    spread: 0.32,
    life: 0.4,
  },
  rocket: {
    letter: "H",
    cooldown: 0.5,
    ammo: 22,
    damage: 5,
    speed: 170,
    pellets: 1,
    spread: 0,
    life: 2.2,
  },
  flame: {
    letter: "F",
    cooldown: 0.045,
    ammo: 130,
    damage: 0.8,
    speed: 150,
    pellets: 1,
    spread: 0.16,
    life: 0.36,
  },
};

// A map's crates hand its weapons out in turn, one per skill.
export const weaponOf = (loot: readonly WeaponId[], crate: number): WeaponId =>
  loot.at(crate % Math.max(1, loot.length)) ?? "rapid";

// Kills less than CHAIN seconds apart build a chain; the chain multiplies the score, up to ×8.
export const CHAIN = 1.6;
export const chainAfter = (chain: number, sinceLast: number) =>
  sinceLast <= CHAIN ? chain + 1 : 1;
export const multiplierOf = (chain: number) => Math.max(1, Math.min(8, chain));

export type Run = {
  readonly cleared: boolean;
  readonly continues: number;
  readonly deaths: number;
  readonly skills: number;
  readonly total: number;
  readonly accuracy: number; // 0 to 1
};
// A hard rank: S is the whole mission on one credit, at most one life lost, every skill, a sure hand.
export const rankOf = (run: Run) => {
  if (!run.cleared) return "-";
  if (run.continues > 0) return "C";
  if (run.deaths <= 1 && run.skills === run.total && run.accuracy >= 0.45) return "S";
  if (run.skills >= run.total - 1 && run.deaths <= 2) return "A";
  return "B";
};

// The difficulty follows the player, never shown and never asked. A tracker reads what the
// player does (shots that land, kills, deaths, shots blocked, special moves), weighted towards
// the last half minute, into a skill. The game aims a little above it, and eases there over a
// few seconds, so it always asks a bit more than the player just gave. A death gives a little
// back at once. The floor rises with each map cleared and each minute played. The score is never
// adjusted: an easier run meets fewer foes and scores less on its own.
export const HEAT = {
  start: 0.8,
  max: 1.6,
  floor: 0.7, // where it can fall back to at first
  margin: 0.12, // how far above the player it aims
  ease: 0.15, // the share of the gap closed each second
  death: 0.14, // given back at once, on a death
  creep: 0.06, // the floor rises this much for each map cleared…
  drift: 0.015, // …and for each minute played
  memory: 30, // seconds over which the past fades by half
} as const;

export const floorOf = (maps: number, minutes: number) =>
  Math.min(HEAT.max - 0.2, HEAT.floor + maps * HEAT.creep + minutes * HEAT.drift);

export type Act = "shot" | "hit" | "kill" | "death" | "block" | "special";

// What the player has done lately, each count fading by half every `memory` seconds.
export class Tracker {
  private counts: Record<Act, number> = {
    shot: 0,
    hit: 0,
    kill: 0,
    death: 0,
    block: 0,
    special: 0,
  };
  private span = 0; // seconds, faded the same way

  observe(act: Act, n = 1) {
    this.counts[act] += n;
  }

  tick(dt: number) {
    const keep = 0.5 ** (dt / HEAT.memory);
    for (const k of Object.keys(this.counts) as Act[]) this.counts[k] *= keep;
    this.span = this.span * keep + dt;
  }

  // A skill around 1: about where the game starts for a player who hits half their shots, kills
  // a foe every few seconds and does not die.
  skill() {
    const c = this.counts;
    const minutes = Math.max(0.25, this.span / 60);
    const accuracy = c.hit / Math.max(4, c.shot);
    const kills = Math.min(30, c.kill / minutes);
    return (
      0.45 +
      accuracy * 0.5 +
      kills / 60 +
      Math.min(6, c.special + c.block * 0.3) * 0.03 -
      (c.death / minutes) * 0.6
    );
  }
}

// The next heat: towards the player's skill plus the margin, eased, never below the floor.
export const heatToward = (heat: number, skill: number, floor: number, dt: number) => {
  const target = Math.max(floor, Math.min(HEAT.max, skill + HEAT.margin));
  return heat + (target - heat) * Math.min(1, dt * HEAT.ease);
};
export const afterDeath = (heat: number, floor: number) => Math.max(floor, heat - HEAT.death);

// What a level of heat does to the foes: how often they fire, how fast their shots fly, how
// long they warn before they do, whether a wave brings one more, how long the boss rests, how
// many may take aim at once, how tough they are, how true they aim and how fast waves come.
// `level` puts the heat between 0 (the floor at first) and 1 (the most it can be).
export const levelOf = (heat: number) =>
  Math.max(0, Math.min(1, (heat - HEAT.floor) / (HEAT.max - HEAT.floor)));
export const tuningOf = (heat: number) => {
  const level = levelOf(heat);
  return {
    fire: heat, // divides the time between shots
    bullet: 0.8 + 0.25 * heat,
    warn: Math.max(0.36, 0.55 / Math.sqrt(heat)), // never quicker than a reflex
    extra: Math.max(0, heat - 1.05), // the chance a spawn brings one more
    rest: 1 / heat,
    bug: 0.85 + 0.2 * heat,
    shooters: 1 + Math.round(level * 3), // foes that may aim at the hero at once: 1 to 4
    tough: 0.7 + 0.65 * level, // multiplies the foes' health
    boss: 0.85 + 0.35 * level, // multiplies the turret's and the boss's
    jitter: 0.14 * (1 - Math.min(1, level * 2.5)), // radians a foe's aim strays, at ease
    pace: 1.25 - 0.4 * level, // multiplies the time between the foes of a wave
    repeat: level > 0.5, // whether the boss may use the same attack twice in a row
  };
};
export type Tuning = ReturnType<typeof tuningOf>;
export const toughen = (hp: number, by: number) => Math.max(1, Math.round(hp * by));

// Help for a player stuck in one place, as an arcade gives: the second death in the same spot
// drops a supply crate where they come back, the third also brings the heat down to its floor;
// each one keeps them safe a little longer on their return. A spot is a lock, or a stretch of
// the map between two.
export const mercyOf = (deathsHere: number) => ({
  supply: deathsHere >= 2,
  calm: deathsHere >= 3,
  safe: 2.6 + Math.min(1.6, Math.max(0, deathsHere - 1) * 0.8), // seconds untouchable
});
export class Spots {
  private deaths = new Map<string, number>();
  die(spot: string) {
    const n = (this.deaths.get(spot) ?? 0) + 1;
    this.deaths.set(spot, n);
    return n;
  }
}
export const spotOf = (lock: number | undefined, x: number) =>
  lock === undefined ? `x${Math.floor(x / 240)}` : `lock${lock}`;

// The boss's next attack: at random from its phase, but at ease never the same twice in a row.
export const nextAttack = <A>(
  attacks: readonly A[],
  last: A | undefined,
  repeat: boolean,
  roll: number,
) => {
  const pool = repeat || attacks.length < 2 ? attacks : attacks.filter((a) => a !== last);
  const from = pool.length ? pool : attacks;
  return from.at(Math.min(from.length - 1, Math.floor(roll * from.length)));
};
