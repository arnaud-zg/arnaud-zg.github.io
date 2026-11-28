// What everything besides a kill is worth (a kill: foes.ts).
export const POINTS = {
  crate: 200,
  weapon: 500,
  mate: 1000,
  turret: 5000,
  boss: 20000,
  bossHit: 20, // per point of damage
  melee: 2, // a kill up close counts this many times
} as const;
