// Each boss falls the way its migration really works: strangled, pruned, or garbage collected.
export type Seam = { readonly name: string; readonly health: number };
export type Package = { readonly name: string; readonly parent?: string; readonly health: number };
export type Reference = { readonly name: string; readonly health: number };

export type Mechanic =
  | { readonly kind: "strangler"; readonly gateway: number; readonly seams: readonly Seam[] }
  | { readonly kind: "prune"; readonly packages: readonly Package[] }
  | {
      readonly kind: "gc";
      readonly references: readonly Reference[];
      readonly heal: number; // health a second while referenced
      readonly referenced: number; // share of a blow that lands while referenced
      readonly sweep: number; // an explosion, once unreferenced, hits this many times harder
    };

// ── Strangler fig: the seam to extract now is the first still standing, the least coupled ──
export const litSeam = (healths: readonly number[]) => healths.findIndex((h) => h > 0);
export const OFF_SEAM = 0.1; // a blow on a coupled seam: a distributed monolith, barely a dent
export const seamBlow = ({ lit, row, damage }: { lit: number; row: number; damage: number }) =>
  row === lit ? damage : damage * OFF_SEAM;

// ── Pruning ──────────────────────────────────────────────────────────────────────────────────
export const importersOf = ({
  packages,
  alive,
  name,
}: {
  packages: readonly Package[];
  alive: ReadonlySet<string>;
  name: string;
}) => packages.filter((p) => p.parent === name && alive.has(p.name)).length;
export const prunable = (args: {
  packages: readonly Package[];
  alive: ReadonlySet<string>;
  name: string;
}) => importersOf(args) === 0;

// ── Garbage collection ───────────────────────────────────────────────────────────────────────
export const gcBlow = ({
  damage,
  referenced,
  blast,
  spec,
}: {
  damage: number;
  referenced: boolean;
  blast: boolean;
  spec: { readonly referenced: number; readonly sweep: number };
}) => {
  if (referenced) return damage * spec.referenced;
  return blast ? damage * spec.sweep : damage;
};

export const healthOf = (mechanic: Mechanic) => {
  const parts = {
    strangler: () =>
      mechanic.kind === "strangler" ? mechanic.seams.reduce((n, s) => n + s.health, 0) : 0,
    prune: () =>
      mechanic.kind === "prune" ? mechanic.packages.reduce((n, p) => n + p.health, 0) : 0,
    gc: () => 0,
  } as const satisfies { [K in Mechanic["kind"]]: () => number };
  return parts[mechanic.kind]();
};
