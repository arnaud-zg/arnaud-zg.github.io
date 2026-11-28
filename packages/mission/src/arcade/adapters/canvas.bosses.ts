// Each boss mechanic on the stage, one class per kind: weak points, body blows, time, looks.
import type { Mechanic as Spec } from "../../combat/domain/bosses.ts";
import type { MissionLabels } from "../domain/labels.ts";
import { gcBlow, litSeam, prunable, seamBlow } from "../../combat/domain/bosses.ts";
import * as art from "./canvas.draw.ts";
import { INK } from "./canvas.sprites.ts";
import { drawText } from "./pixel.font.ts";

type Pt = { readonly x: number; readonly y: number };
type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
type Ctx = CanvasRenderingContext2D;

export const BODY = { w: 44, h: 48 } as const;

// What a mechanic may ask of the fight around it.
export type Arena = {
  readonly boss: () =>
    { readonly x: number; readonly top: number; readonly ratio: number } | undefined;
  readonly gy: () => number;
  readonly hurt: (damage: number) => void;
  readonly heal: (health: number) => void;
  readonly labels: MissionLabels;
  readonly context: () => string;
  readonly fluent: () => boolean;
  readonly owes: (reason: string) => boolean;
  readonly note: (note: { x: number; y: number; text: string; bad?: boolean }) => void;
  readonly banner: (text: string) => void;
  readonly burst: (at: Pt) => void;
  readonly cube: (cube: { x: number; y: number; label: string }) => void;
  readonly lob: (from: Pt) => void;
};

export type Target = {
  readonly box: Box;
  readonly hit: (blow: { damage: number; blast: boolean }) => void;
};

export interface Mechanic {
  health(): number | undefined; // the sum of its parts, when the parts are the boss
  targets(): readonly Target[];
  body(blow: { damage: number; at: Pt; blast: boolean }): void;
  update(dt: number): void;
  draw(ctx: Ctx, t: number): void;
}

const say = (template: string, name: string) => template.replace("{name}", name);

// A warning said at most once a second, so a stream of bullets is not a stream of words.
class Warner {
  private last = -9;
  private t = 0;
  tick(dt: number) {
    this.t += dt;
  }
  warn(arena: Arena, note: { x: number; y: number; text: string }) {
    if (this.t - this.last < 1) return;
    this.last = this.t;
    arena.note({ ...note, bad: true });
  }
}

// ── Strangler fig: route traffic through the gateway, then extract services least coupled first ──
class Strangler implements Mechanic {
  private gateway: number;
  private readonly seams: { name: string; health: number }[];
  private readonly warner = new Warner();
  private chatty = 2.5;

  constructor(
    spec: Extract<Spec, { kind: "strangler" }>,
    private readonly arena: Arena,
    scale: number,
  ) {
    this.gateway = spec.gateway;
    const shared = arena.owes("shortcut") ? [{ name: arena.labels.sharedDb, health: 20 }] : [];
    this.seams = [...shared, ...spec.seams].map((s) => ({
      name: s.name.replace("{context}", arena.context()),
      health: s.health * scale,
    }));
  }

  health() {
    return this.seams.reduce((n, s) => n + s.health, 0);
  }

  private gatewayBox(): Box | undefined {
    const boss = this.arena.boss();
    if (!boss || this.gateway <= 0) return undefined;
    return { x: boss.x - 26, y: this.arena.gy() - 22, w: 12, h: 22 };
  }

  targets() {
    const box = this.gatewayBox();
    if (!box) return [];
    return [
      {
        box,
        hit: ({ damage }: { damage: number }) => {
          this.gateway -= damage;
          if (this.gateway > 0) return;
          this.arena.burst({ x: box.x + 6, y: box.y + 8 });
          this.arena.banner(this.arena.labels.gatewayDown);
        },
      },
    ];
  }

  private rowOf(y: number) {
    const boss = this.arena.boss();
    if (!boss) return -1;
    const rows = this.seams.length;
    return rows - 1 - Math.floor(((y - boss.top) / BODY.h) * rows);
  }

  body({ damage, at }: { damage: number; at: Pt }) {
    const lit = litSeam(this.seams.map((s) => s.health));
    const seam = this.seams.at(lit);
    if (!seam) return;
    const row = this.rowOf(at.y);
    const armoured = this.gateway > 0;
    const blow = armoured ? damage * 0.1 : seamBlow({ lit, row, damage });
    if (armoured) this.warner.warn(this.arena, { ...at, text: this.arena.labels.armoured });
    if (!armoured && row !== lit)
      this.warner.warn(this.arena, { ...at, text: this.arena.labels.wrongSeam });
    const dealt = Math.min(seam.health, blow);
    seam.health -= dealt;
    this.arena.hurt(dealt);
    if (seam.health <= 0) this.extract(seam.name);
  }

  private extract(name: string) {
    const boss = this.arena.boss();
    if (boss) this.arena.cube({ x: boss.x + BODY.w / 2, y: boss.top + 10, label: name });
    this.arena.banner(say(this.arena.labels.extracted, name));
  }

  // Enraged, the services already out make chatty calls back at the hero.
  update(dt: number) {
    this.warner.tick(dt);
    const boss = this.arena.boss();
    if (!boss || boss.ratio > 0.3) return;
    this.chatty -= dt;
    if (this.chatty > 0) return;
    this.chatty = 2.2;
    if (this.seams.some((s) => s.health <= 0)) this.arena.lob({ x: boss.x - 6, y: boss.top + 6 });
  }

  draw(ctx: Ctx, t: number) {
    const boss = this.arena.boss();
    if (!boss) return;
    const gate = this.gatewayBox();
    if (gate) {
      art.block(ctx, gate.x, gate.y, gate.w, gate.h, INK.stone);
      art.rect(
        ctx,
        gate.x + 2,
        gate.y + 3,
        gate.w - 4,
        2,
        Math.floor(t * 3) % 2 ? INK.gold : INK.goldLight,
      );
      drawText(ctx, this.arena.labels.gateway, gate.x + 6, gate.y - 9, 1, INK.goldLight, {
        outline: INK.soot,
        align: "center",
      });
    }
    const rows = this.seams.length;
    const height = BODY.h / rows;
    const lit = litSeam(this.seams.map((s) => s.health));
    this.seams.forEach((seam, i) => {
      const y = Math.round(boss.top + BODY.h - (i + 1) * height);
      if (seam.health <= 0)
        return art.rect(ctx, boss.x + 2, y + 1, BODY.w - 4, Math.max(1, height - 2), INK.soot);
      const on = i === lit && this.gateway <= 0;
      art.rect(ctx, boss.x, y, BODY.w, 1, on ? INK.gold : INK.stoneDark);
      const label = on || this.arena.fluent() ? seam.name : "???";
      if (height >= 9)
        drawText(
          ctx,
          label.slice(0, 7),
          boss.x + BODY.w / 2,
          y + 2,
          1,
          on ? INK.goldLight : INK.stoneLight,
          { outline: INK.soot, align: "center" },
        );
    });
  }
}

// ── Pruning: only a package nothing imports can go; the root goes last ───────────────────────
const SPOTS: readonly Pt[] = [
  { x: 22, y: 2 },
  { x: 10, y: 16 },
  { x: 34, y: 16 },
  { x: -6, y: 30 },
  { x: 10, y: 30 },
  { x: 26, y: 30 },
  { x: 42, y: 30 },
];
const NODE = { w: 12, h: 7 } as const;

class Prune implements Mechanic {
  private readonly packages: { name: string; parent?: string; health: number; max: number }[];
  private readonly warner = new Warner();
  private regrown = false;

  constructor(
    spec: Extract<Spec, { kind: "prune" }>,
    private readonly arena: Arena,
    scale: number,
  ) {
    this.packages = spec.packages.map((p) => ({
      ...p,
      health: p.health * scale,
      max: p.health * scale,
    }));
  }

  health() {
    return this.packages.reduce((n, p) => n + p.health, 0);
  }

  private alive() {
    return new Set(this.packages.filter((p) => p.health > 0).map((p) => p.name));
  }

  private boxOf(index: number): Box | undefined {
    const boss = this.arena.boss();
    const spot = SPOTS.at(index);
    if (!boss || !spot) return undefined;
    return { x: boss.x + spot.x - NODE.w / 2, y: boss.top + spot.y, w: NODE.w, h: NODE.h };
  }

  targets() {
    return this.packages.flatMap((pkg, index) => {
      const box = this.boxOf(index);
      if (!box || pkg.health <= 0) return [];
      return [{ box, hit: ({ damage }: { damage: number }) => this.prune({ pkg, box, damage }) }];
    });
  }

  private prune({
    pkg,
    box,
    damage,
  }: {
    pkg: { name: string; health: number };
    box: Box;
    damage: number;
  }) {
    const packages = this.packages;
    const alive = this.alive();
    if (!prunable({ packages, alive, name: pkg.name })) {
      const n = packages.filter((p) => p.parent === pkg.name && alive.has(p.name)).length;
      return this.warner.warn(this.arena, {
        x: box.x + 6,
        y: box.y - 4,
        text: this.arena.labels.importedBy.replace("{n}", String(n)),
      });
    }
    const dealt = Math.min(pkg.health, damage);
    pkg.health -= dealt;
    this.arena.hurt(dealt);
    if (pkg.health > 0) return;
    this.arena.burst({ x: box.x + 6, y: box.y + 3 });
    this.arena.note({ x: box.x + 6, y: box.y - 4, text: say(this.arena.labels.removed, pkg.name) });
  }

  body({ at }: { at: Pt }) {
    this.warner.warn(this.arena, { ...at, text: this.arena.labels.leavesFirst });
  }

  // Enraged, one pruned leaf comes back once: somebody ran npm install.
  update(dt: number) {
    this.warner.tick(dt);
    const boss = this.arena.boss();
    if (!boss || this.regrown || boss.ratio > 0.3) return;
    const leaf = this.packages.find(
      (p) => p.health <= 0 && !this.packages.some((c) => c.parent === p.name),
    );
    if (!leaf) return;
    this.regrown = true;
    leaf.health = leaf.max;
    this.arena.heal(leaf.max);
    this.arena.banner(say(this.arena.labels.regrew, leaf.name));
  }

  draw(ctx: Ctx) {
    const alive = this.alive();
    this.packages.forEach((pkg, index) => {
      const box = this.boxOf(index);
      const parent = this.packages.findIndex((p) => p.name === pkg.parent);
      const from = this.boxOf(parent);
      if (!box || pkg.health <= 0) return;
      if (from)
        art.pixelLine({
          ctx,
          from: { x: from.x + 6, y: from.y + NODE.h },
          to: { x: box.x + 6, y: box.y },
          color: INK.stoneDark,
        });
      const open = prunable({ packages: this.packages, alive, name: pkg.name });
      art.block(ctx, box.x, box.y, NODE.w, NODE.h, open ? INK.gold : INK.stone);
      drawText(ctx, pkg.name.slice(0, 2), box.x + 6, box.y, 1, INK.soot, { align: "center" });
    });
  }
}

// ── Garbage collection: cut every reference, then sweep ─────────────────────────────────────
class Collect implements Mechanic {
  private readonly references: { name: string; health: number; max: number }[];
  private readonly warner = new Warner();
  private leaked = false;

  constructor(
    private readonly spec: Extract<Spec, { kind: "gc" }>,
    private readonly arena: Arena,
  ) {
    this.references = spec.references.map((r) => ({ ...r, max: r.health }));
  }

  health() {
    return undefined;
  }

  private referenced() {
    return this.references.some((r) => r.health > 0);
  }

  private boxOf(index: number): Box | undefined {
    const boss = this.arena.boss();
    if (!boss) return undefined;
    return { x: boss.x - 22 - index * 16, y: this.arena.gy() - 10, w: 8, h: 10 };
  }

  targets() {
    return this.references.flatMap((ref, index) => {
      const box = this.boxOf(index);
      if (!box || ref.health <= 0) return [];
      return [{ box, hit: ({ damage }: { damage: number }) => this.cut({ ref, box, damage }) }];
    });
  }

  private cut({
    ref,
    box,
    damage,
  }: {
    ref: { name: string; health: number };
    box: Box;
    damage: number;
  }) {
    ref.health -= damage;
    if (ref.health > 0) return;
    this.arena.burst({ x: box.x + 4, y: box.y + 4 });
    this.arena.note({
      x: box.x + 4,
      y: box.y - 6,
      text: say(this.arena.labels.released, ref.name),
    });
    if (!this.referenced()) this.arena.banner(this.arena.labels.unreferenced);
  }

  body({ damage, at, blast }: { damage: number; at: Pt; blast: boolean }) {
    const referenced = this.referenced();
    if (referenced) this.warner.warn(this.arena, { ...at, text: this.arena.labels.referenced });
    this.arena.hurt(gcBlow({ damage, referenced, blast, spec: this.spec }));
  }

  // Referenced, it heals; enraged, one reference leaks back once.
  update(dt: number) {
    this.warner.tick(dt);
    if (this.referenced()) this.arena.heal(this.spec.heal * dt);
    const boss = this.arena.boss();
    if (!boss || this.leaked || boss.ratio > 0.3) return;
    const ref = this.references.find((r) => r.health <= 0);
    if (!ref) return;
    this.leaked = true;
    ref.health = ref.max;
    this.arena.banner(say(this.arena.labels.leakedAgain, ref.name));
  }

  draw(ctx: Ctx, t: number) {
    const boss = this.arena.boss();
    if (!boss) return;
    this.references.forEach((ref, index) => {
      const box = this.boxOf(index);
      if (!box || ref.health <= 0) return;
      const glow = Math.floor(t * 4 + index) % 2 ? INK.goldLight : INK.gold;
      art.pixelLine({
        ctx,
        from: { x: box.x + 4, y: box.y },
        to: { x: boss.x, y: boss.top + 20 + index * 6 },
        color: glow,
      });
      art.block(ctx, box.x, box.y, box.w, box.h, INK.stone);
      drawText(ctx, ref.name.slice(0, 1), box.x + 4, box.y + 2, 1, INK.soot, { align: "center" });
    });
  }
}

type Kind = Spec["kind"];
type Of<K extends Kind> = Extract<Spec, { kind: K }>;
type Build<K extends Kind> = (args: { spec: Of<K>; arena: Arena; scale: number }) => Mechanic;

const BUILDERS: { readonly [K in Kind]: Build<K> } = {
  strangler: ({ spec, arena, scale }) => new Strangler(spec, arena, scale),
  prune: ({ spec, arena, scale }) => new Prune(spec, arena, scale),
  gc: ({ spec, arena }) => new Collect(spec, arena),
};

const buildWith = <K extends Kind>(kind: K, args: { spec: Of<K>; arena: Arena; scale: number }) =>
  BUILDERS[kind](args);

// scale: the boss's health at this heat over its base health, applied to every part.
export const mechanicOf = (args: { spec: Spec; arena: Arena; scale: number }) =>
  buildWith(args.spec.kind, args);
