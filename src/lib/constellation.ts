// Places open-source projects as stars: one constellation per theme, side by side.
// A star's size is the lines changed there; its position is stable from build to build
// (seeded by the repo name), so the sky never reshuffles.

export type Star = { id: string; x: number; y: number; r: number; side: "left" | "right" };
export type Cluster = { name: string; x: number; stars: Star[] };

export const SKY = { w: 1200, h: 470, top: 110, bottom: 50 };

// Small deterministic hash: the same repo always lands in the same spot.
const seed = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

export function constellations(themes: { name: string; projects: { repo: string; lines: number }[] }[]): Cluster[] {
  const max = Math.max(1, ...themes.flatMap((t) => t.projects.map((p) => p.lines)));
  const colW = SKY.w / themes.length;
  return themes.map((t, i) => {
    const cx = colW * (i + 0.5);
    const k = t.projects.length;
    const usable = SKY.h - SKY.top - SKY.bottom;
    const stars = t.projects.map((p, j) => {
      const jitter = seed(p.repo) - 0.5;
      // Zigzag down the column so neighbours never sit on top of each other.
      const dx = k === 1 ? 0 : (j % 2 ? 1 : -1) * colW * 0.16 + jitter * colW * 0.12;
      const y = SKY.top + (k === 1 ? usable / 2 : (usable * j) / (k - 1)) + jitter * 24;
      return { id: p.repo, x: cx + dx, y, r: 6 + 20 * Math.sqrt(p.lines / max), side: (dx < 0 ? "left" : "right") as Star["side"] };
    });
    return { name: t.name, x: cx, stars };
  });
}
