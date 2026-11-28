// The mission's drawn things that are not sprites: foes, props, ledges, bosses, the intro's
// plates. Each is drawn pixel by pixel from rectangles, in the map's theme, so it stays crisp.
import type { BossArt, Layer, PropKind, Theme } from "../../campaign/domain/map.ts";
import { INK } from "./canvas.sprites.ts";

type Ctx = CanvasRenderingContext2D;
const r = Math.round;

export const rect = (ctx: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(r(x), r(y), r(w), r(h));
};
// A filled box with a one-pixel soot rim.
export const block = (ctx: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, INK.soot);
  rect(ctx, x, y, w, h, color);
};
export const line = (ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string) => {
  const n = Math.max(1, Math.abs(r(x1) - r(x0)), Math.abs(r(y1) - r(y0)));
  ctx.fillStyle = color;
  for (let i = 0; i <= n; i++)
    ctx.fillRect(r(x0 + ((x1 - x0) * i) / n), r(y0 + ((y1 - y0) * i) / n), 1, 1);
};
export const disc = (ctx: Ctx, cx: number, cy: number, rad: number, color: string) => {
  ctx.fillStyle = color;
  const R = r(rad);
  for (let dy = -R; dy <= R; dy++) {
    const w = Math.floor(Math.sqrt(R * R - dy * dy));
    ctx.fillRect(r(cx) - w, r(cy) + dy, w * 2 + 1, 1);
  }
};
// A disc on every other pixel, thinning as `gap` grows from 0 to 1: smoke, spray, shadow.
export const dither = (ctx: Ctx, cx: number, cy: number, rad: number, color: string, gap = 0) => {
  ctx.fillStyle = color;
  const R = r(rad),
    X = r(cx),
    Y = r(cy);
  for (let dy = -R; dy <= R; dy++) {
    const w = Math.floor(Math.sqrt(R * R - dy * dy));
    for (let dx = -w; dx <= w; dx++)
      if ((dx + dy) % 2 === 0 && (gap < 0.5 || (dx * 7 + dy * 13) % 3 !== 0))
        ctx.fillRect(X + dx, Y + dy, 1, 1);
  }
};

// ── The backdrop ─────────────────────────────────────────────────────────────────────────────
const wave = (x: number, seed: number) =>
  Math.sin(x * 0.021 + seed) * 0.6 +
  Math.sin(x * 0.057 + seed * 2.1) * 0.3 +
  Math.sin(x * 0.13 + seed * 3.7) * 0.1;

// A ruined town against the sky: houses of varying height, now and then a dome or a tower.
const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};
const town = (wx: number, l: Layer) => {
  const width = 18;
  const b = Math.floor(wx / width),
    at = wx - b * width;
  const k = hash(b + l.seed * 31);
  const h = l.base * 0.5 + k * l.amp;
  if (at < 2) return h * 0.4; // a gap between houses
  if (k > 0.82 && at > 6 && at < 12) return h + 16; // a tower
  if (k > 0.55 && k <= 0.82) {
    const dx = (at - width / 2) / (width / 2 - 2);
    return h + Math.sqrt(Math.max(0, 1 - dx * dx)) * 7; // a dome
  }
  return h;
};

const heightAt = (l: Layer, wx: number) => {
  if (l.kind === "skyline") return town(wx, l);
  const h = l.base + wave(wx, l.seed) * l.amp;
  return l.kind === "canopy" ? h + Math.abs(Math.sin(wx * 0.22 + l.seed)) * 5 : h; // crowns of trees
};

// A still layer is drawn once, as a strip as long as any map and its parallax need, then copied
// a screen at a time: one stroke a frame instead of one per column.
const STRIP = 2400;
const strips = new WeakMap<Layer, HTMLCanvasElement>();
const stripOf = (l: Layer) => {
  const known = strips.get(l);
  if (known) return known;
  const c = document.createElement("canvas");
  c.width = STRIP;
  c.height = r(l.base + l.amp + 24);
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = l.color;
    for (let x = 0; x < STRIP; x++) {
      const h = r(heightAt(l, x));
      g.fillRect(x, c.height - h, 1, h);
    }
  }
  strips.set(l, c);
  return c;
};

export const layer = (ctx: Ctx, l: Layer, camX: number, W: number, gy: number, t: number) => {
  ctx.globalAlpha = l.alpha;
  if (l.kind !== "sea") {
    const strip = stripOf(l);
    const at = r(camX * l.parallax) % Math.max(1, STRIP - W);
    ctx.drawImage(strip, at, 0, W, strip.height, 0, gy - strip.height, W, strip.height);
    ctx.globalAlpha = 1;
    return;
  }
  // The sea moves with time: it is drawn afresh, column by column, with moonlight on it.
  ctx.fillStyle = l.color;
  for (let x = 0; x < W; x++) {
    const h = r(l.base + Math.sin((x + camX * l.parallax) * 0.2 + t * 2) * l.amp);
    ctx.fillRect(x, gy - h, 1, h);
  }
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#cfe6ff";
  for (let i = 0; i < 18; i++)
    ctx.fillRect(
      r(W * 0.7 + Math.sin(i * 7.3 + t) * 22),
      gy - l.base + 3 + (i % 6) * 2,
      3 + (i % 3),
      1,
    );
  ctx.globalAlpha = 1;
};

export const ground = (W: number, length: number, theme: Theme) => {
  const c = document.createElement("canvas");
  c.width = length + W;
  c.height = 30;
  const g = c.getContext("2d");
  if (!g) return c;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const { base, light, dark, speck } = theme.ground;
  g.fillStyle = base;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = dark;
  g.fillRect(0, 0, c.width, 1);
  g.fillStyle = light;
  g.fillRect(0, 1, c.width, 1);
  for (let i = 0; i < c.width * 1.6; i++) {
    g.fillStyle = rnd() < 0.6 ? speck : light;
    g.fillRect(Math.floor(rnd() * c.width), 3 + Math.floor(rnd() * 27), rnd() < 0.2 ? 2 : 1, 1);
  }
  if (theme.ledge === "plank")
    for (let x = 0; x < c.width; x += 3) {
      g.fillStyle = light;
      g.fillRect(x, 0, 1, 1 + Math.floor(rnd() * 3)); // grass
    }
  return c;
};

export const ledge = (
  ctx: Ctx,
  x: number,
  top: number,
  w: number,
  gy: number,
  look: Theme["ledge"],
) => {
  if (look === "stone") {
    // a broken wall, its top walkable
    block(ctx, x, top, w, gy - top, "#c9a86a");
    for (let y = top + 4; y < gy; y += 5) rect(ctx, x, y, w, 1, "#8a6f3e");
    for (let y = top; y < gy; y += 10)
      for (let bx = x + (y % 20 ? 4 : 10); bx < x + w; bx += 12) rect(ctx, bx, y, 1, 5, "#8a6f3e");
    rect(ctx, x, top, w, 1, "#f6dea4");
    return;
  }
  const post = look === "pier" ? "#5b4632" : "#6b4a2a";
  const plank = look === "pier" ? "#8a6f52" : "#a07040";
  block(ctx, x + 3, top + 2, 2, gy - top - 2, post);
  block(ctx, x + w - 5, top + 2, 2, gy - top - 2, post);
  if (gy - top > 18) line(ctx, x + 4, top + 4, x + w - 5, gy - 2, post);
  block(ctx, x, top, w, 3, plank);
  for (let px = x + 5; px < x + w; px += 6) rect(ctx, px, top, 1, 3, post);
};

export const prop = (ctx: Ctx, kind: PropKind, x: number, gy: number, t: number) => {
  switch (kind) {
    case "rack": {
      block(ctx, x, gy - 26, 14, 26, "#3c3f47");
      for (let y = gy - 23; y < gy - 2; y += 4) {
        rect(ctx, x + 2, y, 10, 2, "#5a5e68");
        rect(ctx, x + 10, y, 1, 1, Math.floor(t * 2 + y) % 3 ? "#3fae6a" : "#e0645a");
      }
      return;
    }
    case "palm": {
      for (let i = 0; i < 30; i++)
        rect(ctx, x + Math.sin(i * 0.1) * 3, gy - i, 3, 1, i % 4 ? "#8a5a2b" : "#5a3b26");
      const tx = x + Math.sin(3) * 3 + 1,
        ty = gy - 30;
      for (const [dx, dy] of [
        [-12, 4],
        [12, 4],
        [-8, -3],
        [8, -3],
        [0, -6],
      ] as const) {
        line(ctx, tx, ty, tx + dx, ty + dy, "#56642c");
        line(ctx, tx, ty + 1, tx + dx, ty + dy + 1, "#3c4a1e");
      }
      return;
    }
    case "tree": {
      block(ctx, x + 6, gy - 26, 5, 26, "#5a3b26");
      for (const [dx, dy, rad] of [
        [8, -30, 10],
        [0, -26, 7],
        [16, -26, 7],
        [8, -38, 7],
      ] as const) {
        disc(ctx, x + dx, gy + dy, rad + 1, INK.soot);
        disc(ctx, x + dx, gy + dy, rad, "#2f5a2a");
        dither(ctx, x + dx - 2, gy + dy - 2, rad - 3, "#4f8a3a");
      }
      line(ctx, x + 14, gy - 22, x + 18, gy - 4, "#56642c"); // a vine
      return;
    }
    case "reeds": {
      for (let i = 0; i < 7; i++)
        line(
          ctx,
          x + i * 2,
          gy,
          x + i * 2 + Math.sin(t * 1.5 + i) * 1.5,
          gy - 8 - (i % 3) * 3,
          i % 2 ? "#56642c" : "#8fb04a",
        );
      return;
    }
    case "arch": {
      block(ctx, x, gy - 34, 8, 34, "#b89a5a");
      block(ctx, x + 26, gy - 34, 8, 34, "#b89a5a");
      block(ctx, x, gy - 40, 34, 6, "#c9a86a");
      for (let i = 0; i < 18; i++)
        rect(ctx, x + 8 + i, gy - 34 + Math.abs(9 - i) * 0.5, 1, 1, "#8a6f3e");
      rect(ctx, x + 30, gy - 40, 4, 3, "#e8c37a"); // broken corner
      return;
    }
    case "wreck": {
      // a hull on its side, half in the sand
      for (let i = 0; i < 40; i++) {
        const h = r(Math.sin((i / 40) * Math.PI) * 16);
        rect(ctx, x + i, gy - h, 1, h, i % 6 === 0 ? "#3a2a1e" : "#5b4632");
      }
      rect(ctx, x + 10, gy - 12, 3, 3, "#1b1410");
      rect(ctx, x + 22, gy - 14, 3, 3, "#1b1410");
      line(ctx, x + 20, gy - 16, x + 24, gy - 30, "#5b4632"); // a broken mast
      return;
    }
    case "buoy": {
      const bob = r(Math.sin(t * 2 + x) * 1);
      block(ctx, x, gy - 9 + bob, 6, 7, INK.rust);
      rect(ctx, x, gy - 6 + bob, 6, 2, INK.cream);
      rect(ctx, x + 2, gy - 13 + bob, 2, 4, INK.soot);
      if (Math.floor(t * 2) % 2) rect(ctx, x + 2, gy - 14 + bob, 2, 1, INK.gold);
      return;
    }
  }
};

// ── Foes ─────────────────────────────────────────────────────────────────────────────────────
// A sentry robot, 14 × 16, one eye that brightens as it aims.
export const robot = (
  ctx: Ctx,
  x: number,
  top: number,
  facing: 1 | -1,
  theme: Theme,
  t: number,
  aiming: boolean,
  walking: boolean,
  flash: boolean,
) => {
  const [body, light, dark] = theme.robot;
  const c = (k: string) => (flash ? INK.white : k);
  const step = walking ? Math.floor(t * 8) % 2 : 0;
  block(ctx, x + 4, top + 12, 2, 4 - step, c(dark));
  block(ctx, x + 9, top + 12, 2, 3 + step, c(dark));
  block(ctx, x + 3, top + 8, 9, 5, c(dark));
  block(ctx, x + 2, top + 1, 11, 7, c(body));
  rect(ctx, x + 2, top + 1, 11, 1, c(light));
  const ex = facing === -1 ? x + 3 : x + 9;
  rect(ctx, ex, top + 3, 3, 2, aiming && Math.floor(t * 16) % 2 ? INK.goldLight : INK.rust);
  rect(ctx, x + 7, top - 2, 1, 3, c(dark));
  rect(ctx, x + 7, top - 3, 1, 1, Math.floor(t * 3) % 2 ? INK.ember : INK.soot);
  const gx = facing === -1 ? x - 3 : x + 12;
  block(ctx, gx, top + 9, 5, 2, c("#4b4f5a"));
};

// A drone, 14 wide: rotors on top, a light underneath, a bomb bay.
export const drone = (ctx: Ctx, x: number, y: number, theme: Theme, t: number, flash: boolean) => {
  const [body, light] = theme.robot;
  const spin = Math.floor(t * 20) % 2;
  rect(ctx, x + (spin ? 0 : 3), y - 3, spin ? 14 : 8, 1, INK.soot);
  rect(ctx, x + 6, y - 2, 2, 2, INK.soot);
  block(ctx, x + 1, y, 12, 4, flash ? INK.white : body);
  rect(ctx, x + 1, y, 12, 1, flash ? INK.white : light);
  rect(ctx, x + 6, y + 4, 2, 1, Math.floor(t * 4) % 2 ? INK.rust : INK.ember);
};

// A bug, drawn from the map's shell colours.
export const bug = (
  ctx: Ctx,
  x: number,
  top: number,
  facing: 1 | -1,
  theme: Theme,
  t: number,
  flash: boolean,
) => {
  const [shell, shine] = theme.bug;
  block(ctx, x + 1, top + 1, 8, 3, flash ? INK.white : shell);
  rect(ctx, x + 3, top + 1, 3, 1, flash ? INK.white : shine);
  rect(ctx, facing === -1 ? x : x + 8, top + 2, 2, 2, INK.soot);
  rect(ctx, facing === -1 ? x : x + 9, top + 2, 1, 1, INK.white);
  const s = Math.floor(t * 10) % 2;
  for (let i = 0; i < 3; i++) rect(ctx, x + 2 + i * 3 + s, top + 5, 1, 1, INK.soot);
};

// A teammate held captive, seated and roped, or freed and waving.
export const mate = (ctx: Ctx, x: number, feet: number, freed: boolean, t: number) => {
  const top = feet - (freed ? 16 : 12);
  block(ctx, x + 3, top, 6, 6, "#f1bf91");
  rect(ctx, x + 3, top, 6, 2, "#2b1d19");
  rect(ctx, x + 6, top + 3, 1, 1, INK.soot);
  block(ctx, x + 2, top + 6, 8, freed ? 6 : 5, INK.olive);
  if (freed) {
    block(ctx, x + 3, top + 12, 2, 4, "#3d4a6b");
    block(ctx, x + 7, top + 12, 2, 4, "#3d4a6b");
    const up = Math.floor(t * 6) % 2;
    block(ctx, x + 10, top + (up ? 1 : 4), 2, 4, "#f1bf91");
  } else {
    block(ctx, x + 1, top + 11, 10, 1, "#5a3b26");
    rect(ctx, x + 1, top + 7, 10, 1, INK.cream);
    rect(ctx, x + 1, top + 9, 10, 1, INK.cream);
  }
};

// A weapon or gift box: gold, its letter stamped on it.
export const box = (ctx: Ctx, x: number, y: number, color: string) => {
  block(ctx, x, y, 9, 9, color);
  rect(ctx, x, y, 9, 1, INK.goldLight);
  rect(ctx, x, y + 8, 9, 1, INK.ember);
};

// The mid-boss: a squat turret on treads, a green plate and a red one, a barrel that aims.
export const turret = (
  ctx: Ctx,
  x: number,
  gy: number,
  theme: Theme,
  t: number,
  aim: number,
  glow: boolean,
  flash: boolean,
) => {
  const [body, light, dark] = theme.robot;
  const c = (k: string) => (flash ? INK.white : k);
  block(ctx, x, gy - 7, 36, 7, c(INK.soot));
  for (let i = 0; i < 5; i++) disc(ctx, x + 4 + i * 7, gy - 3, 2, c(dark));
  block(ctx, x + 3, gy - 20, 30, 12, c(body));
  rect(ctx, x + 3, gy - 20, 30, 1, c(light));
  block(ctx, x + 6, gy - 17, 8, 6, c("#2c8a50"));
  rect(ctx, x + 9, gy - 16, 2, 4, INK.white);
  rect(ctx, x + 8, gy - 15, 6, 2, INK.white);
  block(ctx, x + 22, gy - 17, 8, 6, c("#c4483e"));
  rect(ctx, x + 23, gy - 15, 6, 2, INK.white);
  const cx = x + 18,
    cy = gy - 22;
  block(ctx, cx - 5, cy - 3, 10, 5, c(dark));
  for (let i = 0; i < 12; i++)
    rect(
      ctx,
      cx + Math.cos(aim) * i - 1,
      cy + Math.sin(aim) * i - 1,
      3,
      3,
      i > 9 && glow ? INK.ember : c("#4b4f5a"),
    );
};

// ── Bosses, 44 × 48 ─────────────────────────────────────────────────────────────────────────
const CRACKS: [number, number][][] = [
  [
    [6, 2],
    [9, 8],
    [7, 12],
  ],
  [
    [36, 4],
    [33, 10],
    [35, 15],
  ],
  [
    [20, 34],
    [17, 40],
    [21, 46],
  ],
  [
    [40, 24],
    [35, 28],
    [38, 33],
  ],
  [
    [3, 30],
    [8, 33],
    [5, 39],
  ],
  [
    [24, 2],
    [22, 7],
    [26, 10],
  ],
];
export type BossLook = {
  hurt: number;
  phase: number;
  t: number;
  flash: boolean;
  mouth: boolean;
  eye: boolean;
};

export const boss = (ctx: Ctx, art: BossArt, x: number, y: number, look: BossLook) => {
  const w = 44,
    h = 48;
  const eyes =
    look.phase >= 2
      ? Math.floor(look.t * 10) % 2
        ? INK.white
        : INK.rust
      : Math.floor(look.t * 6) % 2
        ? INK.gold
        : INK.ember;
  if (art === "monolith") {
    block(ctx, x, y, w, h, INK.stone);
    rect(ctx, x, y, w, 2, INK.stoneLight);
    rect(ctx, x, y, 2, h, INK.stoneLight);
    rect(ctx, x + w - 4, y, 4, h, INK.stoneDark);
    for (let rr = 0; rr < 8; rr++) {
      const by = y + 2 + rr * 6;
      rect(ctx, x, by + 5, w, 1, INK.mortar);
      for (let jx = rr % 2 ? 6 : 0; jx < w; jx += 12) rect(ctx, x + jx, by, 1, 5, INK.mortar);
    }
    for (const [ex, flip] of [
      [8, 1],
      [26, -1],
    ] as const) {
      rect(ctx, x + ex, y + 15, 10, 5, INK.soot);
      for (let i = 0; i < 10; i++)
        rect(ctx, x + ex + i, y + 12 + r(((flip === 1 ? i : 9 - i) * 3) / 9), 1, 2, INK.soot);
      rect(ctx, x + ex + 2, y + 17, 6, 1, look.eye ? INK.white : eyes);
    }
    rect(ctx, x + 11, y + 25, 22, 6, look.mouth ? INK.ember : INK.soot);
    for (let i = 0; i < 5; i++) {
      rect(ctx, x + 12 + i * 4, y + 25, 2, 2, INK.cream);
      rect(ctx, x + 14 + i * 4, y + 29, 2, 2, INK.cream);
    }
  } else if (art === "tree") {
    // roots, a trunk with a face, a crown of leaves
    for (let i = 0; i < 5; i++) line(ctx, x + 14 + i * 4, y + h - 8, x + i * 11, y + h, "#3a2618");
    block(ctx, x + 10, y + 14, 24, h - 14, "#5a3b26");
    for (let yy = y + 16; yy < y + h; yy += 4)
      rect(ctx, x + 12 + ((yy / 4) % 3) * 6, yy, 4, 1, "#3a2618");
    for (const [dx, dy, rad] of [
      [22, 8, 14],
      [8, 12, 9],
      [36, 12, 9],
      [22, -2, 9],
    ] as const) {
      disc(ctx, x + dx, y + dy, rad + 1, INK.soot);
      disc(ctx, x + dx, y + dy, rad, look.phase >= 3 ? "#5a4a1e" : "#2f5a2a");
      dither(ctx, x + dx - 3, y + dy - 3, rad - 4, look.phase >= 3 ? "#8a6a2a" : "#4f8a3a");
    }
    rect(ctx, x + 14, y + 22, 5, 3, INK.soot);
    rect(ctx, x + 25, y + 22, 5, 3, INK.soot);
    rect(ctx, x + 15, y + 23, 3, 1, look.eye ? INK.white : eyes);
    rect(ctx, x + 26, y + 23, 3, 1, look.eye ? INK.white : eyes);
    rect(ctx, x + 15, y + 31, 14, 4, look.mouth ? INK.ember : INK.soot);
    for (let i = 0; i < 3; i++) rect(ctx, x + 16 + i * 5, y + 31, 2, 2, "#d6c08a");
  } else {
    // a rusty tank on legs, a porthole eye, pipes that drip
    block(ctx, x + 2, y + 6, 40, 34, INK.rust);
    rect(ctx, x + 2, y + 6, 40, 2, INK.ember);
    for (let yy = y + 12; yy < y + 40; yy += 7) rect(ctx, x + 2, yy, 40, 1, "#7a3a1e");
    for (let xx = x + 6; xx < x + 42; xx += 8) rect(ctx, xx, y + 10, 1, 1, INK.cream);
    disc(ctx, x + 22, y + 20, 8, INK.soot);
    disc(ctx, x + 22, y + 20, 6, "#9fb0c0");
    disc(ctx, x + 22, y + 20, 3, look.eye ? INK.white : eyes);
    block(ctx, x + 12, y + 30, 20, 4, look.mouth ? "#3f9fd0" : INK.soot);
    block(ctx, x - 2, y + 14, 6, 3, "#5a5e68");
    block(ctx, x + 40, y + 24, 6, 3, "#5a5e68");
    for (let i = 0; i < 3; i++)
      rect(ctx, x - 1, y + 18 + ((look.t * 20 + i * 4) % 14), 1, 2, "#3f9fd0");
    block(ctx, x + 6, y + 40, 6, 8, INK.stoneDark);
    block(ctx, x + 32, y + 40, 6, 8, INK.stoneDark);
  }
  const shown = Math.floor(look.hurt * (CRACKS.length + 1));
  CRACKS.slice(0, shown).forEach((crack) =>
    crack.forEach(([cx, cy], i) => {
      const prev = crack.at(i - 1);
      if (i > 0 && prev) line(ctx, x + prev[0], y + prev[1], x + cx, y + cy, INK.soot);
    }),
  );
  // A hit flashes the body, not the empty corners around it.
  if (look.flash && Math.floor(look.t * 30) % 2 === 0) {
    ctx.globalAlpha = 0.55;
    if (art === "monolith") rect(ctx, x, y, w, h, INK.white);
    else if (art === "tree") rect(ctx, x + 10, y + 14, 24, h - 14, INK.white);
    else rect(ctx, x + 2, y + 6, 40, 34, INK.white);
    ctx.globalAlpha = 1;
  }
};

// A padlock, for the characters still locked.
export const padlock = (ctx: Ctx, x: number, y: number, color: string) => {
  rect(ctx, x + 2, y, 5, 1, color);
  rect(ctx, x + 1, y + 1, 1, 4, color);
  rect(ctx, x + 7, y + 1, 1, 4, color);
  block(ctx, x, y + 5, 9, 7, color);
  rect(ctx, x + 4, y + 7, 1, 3, INK.soot);
};

// A whiteboard on two legs, scribbled on; a "?" bobs over it until it has been used.
export const whiteboard = (ctx: Ctx, x: number, gy: number, t: number, used: boolean) => {
  const left = Math.round(x - 10);
  rect(ctx, left + 2, gy - 12, 1, 12, INK.stoneDark);
  rect(ctx, left + 17, gy - 12, 1, 12, INK.stoneDark);
  rect(ctx, left, gy - 26, 20, 15, INK.stone);
  rect(ctx, left + 1, gy - 25, 18, 13, "#f4f1e8");
  rect(ctx, left + 3, gy - 23, 8, 1, "#3f6fd0");
  rect(ctx, left + 3, gy - 20, 12, 1, "#3f6fd0");
  rect(ctx, left + 3, gy - 17, 6, 1, INK.rust);
  rect(ctx, left + 11, gy - 18, 4, 4, "#3f6fd0");
  if (used) return;
  const bob = Math.round(Math.sin(t * 4) * 2);
  block(ctx, left + 6, gy - 38 + bob, 8, 9, INK.gold);
  rect(ctx, left + 8, gy - 36 + bob, 4, 1, INK.soot);
  rect(ctx, left + 11, gy - 35 + bob, 1, 2, INK.soot);
  rect(ctx, left + 9, gy - 33 + bob, 2, 1, INK.soot);
  rect(ctx, left + 9, gy - 31 + bob, 2, 1, INK.soot);
};

// A sprite that failed to load: the magenta and black checks every engine falls back to.
export const missing = (ctx: Ctx, x: number, y: number, w: number, h: number) => {
  const size = 3;
  for (let dy = 0; dy < h; dy += size)
    for (let dx = 0; dx < w; dx += size)
      rect(
        ctx,
        Math.round(x + dx),
        Math.round(y + dy),
        Math.min(size, w - dx),
        Math.min(size, h - dy),
        (dx + dy) % (size * 2) ? "#ff00ff" : "#000000",
      );
};

// The office and the night shift (catalog/foes.ts). A Jira ticket on little legs, priority red.
export const ticket = (ctx: Ctx, x: number, y: number, t: number, flash: boolean) => {
  const step = Math.floor(t * 8) % 2;
  block(ctx, x, y, 10, 6, flash ? INK.white : "#f4f1e8");
  rect(ctx, x, y, 10, 1, "#3f6fd0");
  rect(ctx, x + 2, y + 2, 5, 1, INK.stone);
  rect(ctx, x + 7, y + 3, 2, 2, INK.rust);
  rect(ctx, x + 2 + step, y + 6, 1, 1, INK.soot);
  rect(ctx, x + 7 - step, y + 6, 1, 1, INK.soot);
};

// A meeting invite: a calendar page with its red header, flapping in.
export const invite = (ctx: Ctx, x: number, y: number, t: number, flash: boolean) => {
  const flap = Math.floor(t * 10) % 2;
  block(ctx, x, y + flap, 14, 7, flash ? INK.white : "#f4f1e8");
  rect(ctx, x, y + flap, 14, 2, INK.rust);
  rect(ctx, x + 3, y + 4 + flap, 2, 1, INK.soot);
  rect(ctx, x + 7, y + 4 + flap, 2, 1, INK.soot);
  rect(ctx, x + 10, y + 4 + flap, 1, 1, "#3f6fd0");
};

// A 3 a.m. pager: the drone, and a red light that never stops blinking.
export const pagerLight = (ctx: Ctx, x: number, y: number, t: number) => {
  if (Math.floor(t * 6) % 2) rect(ctx, x + 6, y - 2, 2, 2, "#ff3b30");
};

// The robot's tie, for the reorg: corporate to the last bolt.
export const tie = (ctx: Ctx, x: number, y: number, facing: 1 | -1) => {
  const at = facing === 1 ? x + 6 : x + 7;
  rect(ctx, at, y + 8, 1, 4, INK.rust);
  rect(ctx, at - 1, y + 8, 3, 1, INK.rust);
};

// A zombie process: the robot gone green, with a Z once it has come back.
export const undead = (ctx: Ctx, x: number, y: number, revived: boolean) => {
  ctx.globalAlpha = 0.35;
  rect(ctx, x, y, 14, 16, "#5bd35b");
  ctx.globalAlpha = 1;
  if (revived) rect(ctx, x + 10, y - 4, 3, 1, "#5bd35b");
};

// What a colleague throws or sends: a nit in a speech bubble, a calendar invite.
export const nitBubble = (ctx: Ctx, x: number, y: number) => {
  block(ctx, x - 4, y - 3, 9, 6, INK.white);
  rect(ctx, x - 2, y - 1, 1, 2, INK.rust);
  rect(ctx, x, y - 1, 1, 2, INK.rust);
  rect(ctx, x + 2, y - 1, 1, 2, INK.rust);
};
export const inviteDrop = (ctx: Ctx, x: number, y: number) => {
  block(ctx, x - 2, y - 2, 5, 4, "#f4f1e8");
  rect(ctx, x - 2, y - 2, 5, 1, INK.rust);
};

// A colleague: hair, a face, a shirt of their own, legs that walk when they walk.
export const colleague = (
  ctx: Ctx,
  look: { x: number; feet: number; shirt: string; hair: string; t: number; walking: boolean },
) => {
  const x = Math.round(look.x);
  const top = look.feet - 18;
  const step = look.walking ? Math.floor(look.t * 8) % 2 : 0;
  rect(ctx, x + 2, top, 6, 2, look.hair);
  block(ctx, x + 2, top + 2, 6, 5, "#f1bf91");
  rect(ctx, x + 6, top + 4, 1, 1, INK.soot);
  block(ctx, x + 1, top + 7, 8, 6, look.shirt);
  rect(ctx, x + 2 + step, top + 13, 2, 5, "#2e3a55");
  rect(ctx, x + 6 - step, top + 13, 2, 5, "#2e3a55");
};

// A line of pixels from one point to another, so nothing is smoothed.
export const pixelLine = ({
  ctx,
  from,
  to,
  color,
}: {
  ctx: Ctx;
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}) => {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
  for (let i = 0; i <= steps; i++)
    rect(
      ctx,
      Math.round(from.x + ((to.x - from.x) * i) / steps),
      Math.round(from.y + ((to.y - from.y) * i) / steps),
      1,
      1,
      color,
    );
};

// What lies around (catalog/items.ts); `spin` turns a thrown one a quarter at a time.
const PROP_ART = {
  coffee: (ctx: Ctx, x: number, y: number) => {
    block(ctx, x, y + 1, 5, 6, INK.white);
    rect(ctx, x + 1, y + 1, 3, 1, "#6b3f22");
    rect(ctx, x + 5, y + 3, 1, 2, INK.white);
    rect(ctx, x + 1, y - 1, 1, 1, INK.stoneLight);
    rect(ctx, x + 3, y - 2, 1, 1, INK.stoneLight);
  },
  duck: (ctx: Ctx, x: number, y: number) => {
    block(ctx, x, y + 3, 7, 4, "#ffd43b");
    block(ctx, x + 4, y, 3, 4, "#ffd43b");
    rect(ctx, x + 7, y + 2, 2, 1, "#ff8c1a");
    rect(ctx, x + 5, y + 1, 1, 1, INK.soot);
  },
  keyboard: (ctx: Ctx, x: number, y: number) => {
    block(ctx, x, y + 3, 12, 4, "#2b2f3a");
    for (let i = 0; i < 5; i++) rect(ctx, x + 1 + i * 2, y + 4, 1, 1, INK.stoneLight);
    rect(ctx, x + 3, y + 6, 6, 1, INK.stoneLight);
  },
} as const;

export const item = (
  ctx: Ctx,
  args: { id: keyof typeof PROP_ART; x: number; y: number; spin?: number },
) => {
  const turn = args.spin ?? 0;
  if (turn % 2 === 0) return PROP_ART[args.id](ctx, Math.round(args.x), Math.round(args.y));
  ctx.save();
  ctx.translate(Math.round(args.x) + 6, Math.round(args.y) + 4);
  ctx.scale(-1, turn === 3 ? -1 : 1);
  PROP_ART[args.id](ctx, -6, -4);
  ctx.restore();
};
