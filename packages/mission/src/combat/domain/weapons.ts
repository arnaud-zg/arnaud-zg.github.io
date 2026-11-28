// The weapons: what each fires, how fast and how hard, and which one a crate holds.

export type WeaponId = "pistol" | "rapid" | "spread" | "rocket" | "flame" | "reload";
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
  // The feedback loop, made instant: what the CI cannon becomes once it is fast.
  reload: {
    letter: "H",
    cooldown: 0.07,
    ammo: Infinity,
    damage: 1.2,
    speed: 380,
    pellets: 1,
    spread: 0.03,
    life: 1.1,
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
