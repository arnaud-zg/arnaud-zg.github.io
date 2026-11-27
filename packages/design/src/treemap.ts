// Squarified treemap (Bruls, Huizing, van Wijk). Lays out values inside a w×h box so each
// rectangle's area is proportional to its value and stays as close to square as possible.
// Returns rectangles in percent of the box, in the input order.

export type Rect = { x: number; y: number; w: number; h: number };
// What a Treemap shows. `downloads` and `monthlyReleases` cover one month, named in `month`.
export type Tool = {
  name: string;
  line: string;
  href: string;
  monthlyReleases: number;
  members: number;
  downloads?: number;
  month: string;
};
export type Tile = {
  tool: Tool;
  releases: number;
  weight: number;
  recent: boolean;
  rect: Rect;
  mrect: Rect;
};
export type Group = { name: string; emoji: string; rect: Rect; tiles: Tile[] };
export type ToolLabels = {
  monthlyReleases: string;
  plugins: string;
  monthlyDownloads: string;
  viewOnNpm: string;
  showDetails: (name: string) => string;
};

// 1234 -> 1.2k, so a figure fits its badge.
export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);

// The treemap's box on wide screens, in arbitrary units (16:7). Shared by the build and the hover script.
export const TREEMAP_BOX = { w: 16, h: 7 };

// `keepOrder` lays items out in the given order: a resized item then stays where it was.
export function squarify(
  values: number[],
  width: number,
  height: number,
  keepOrder = false,
): Rect[] {
  const total = values.reduce((a, b) => a + b, 0);
  const out: Rect[] = new Array(values.length);
  if (!total) return values.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
  // Work on items sorted large to small, in absolute units, then map back.
  const items = values.map((v, i) => ({ i, a: (v / total) * width * height }));
  if (!keepOrder) items.sort((p, q) => q.a - p.a);
  let x = 0,
    y = 0,
    w = width,
    h = height;

  // How far from square the row's worst tile is, from the row's sum, largest and smallest area.
  const worst = (s: number, max: number, min: number, side: number) =>
    Math.max((side * side * max) / (s * s), (s * s) / (side * side * min));
  const place = (row: { i: number; a: number }[]) => {
    const s = row.reduce((n, r) => n + r.a, 0);
    if (w >= h) {
      const cw = s / h;
      let cy = y;
      for (const r of row) {
        const rh = r.a / cw;
        out[r.i] = { x, y: cy, w: cw, h: rh };
        cy += rh;
      }
      x += cw;
      w -= cw;
    } else {
      const ch = s / w;
      let cx = x;
      for (const r of row) {
        const rw = r.a / ch;
        out[r.i] = { x: cx, y, w: rw, h: ch };
        cx += rw;
      }
      y += ch;
      h -= ch;
    }
  };

  // The row only grows until it is placed, so its sum, largest and smallest area are kept as it
  // grows: each item is weighed in O(1), not by summing the row again. The sum adds in the same
  // order as before, so every layout is the same to the last bit.
  let row: { i: number; a: number }[] = [];
  let sum = 0,
    max = 0,
    min = 0;
  for (const item of items) {
    const side = Math.min(w, h);
    const grown = sum + item.a;
    const keep =
      !row.length ||
      worst(grown, Math.max(max, item.a), Math.min(min, item.a), side) <=
        worst(sum, max, min, side);
    if (!keep) {
      place(row);
      row = [];
    }
    row.push(item);
    sum = keep ? grown : item.a;
    max = keep && row.length > 1 ? Math.max(max, item.a) : item.a;
    min = keep && row.length > 1 ? Math.min(min, item.a) : item.a;
  }
  if (row.length) place(row);

  return out.map((r) => ({
    x: (r.x / width) * 100,
    y: (r.y / height) * 100,
    w: (r.w / width) * 100,
    h: (r.h / height) * 100,
  }));
}
