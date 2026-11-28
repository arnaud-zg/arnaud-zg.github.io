// A 5×7 pixel font, drawn for the mission: capitals, digits and the marks its words need.
// Each glyph is seven rows of five bits; a character it lacks is drawn as "?".
const GLYPHS: Record<string, string> = {
  A: "01110 10001 10001 11111 10001 10001 10001",
  B: "11110 10001 10001 11110 10001 10001 11110",
  C: "01110 10001 10000 10000 10000 10001 01110",
  D: "11110 10001 10001 10001 10001 10001 11110",
  E: "11111 10000 10000 11110 10000 10000 11111",
  F: "11111 10000 10000 11110 10000 10000 10000",
  G: "01110 10001 10000 10111 10001 10001 01111",
  H: "10001 10001 10001 11111 10001 10001 10001",
  I: "01110 00100 00100 00100 00100 00100 01110",
  J: "00111 00010 00010 00010 00010 10010 01100",
  K: "10001 10010 10100 11000 10100 10010 10001",
  L: "10000 10000 10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10101 10001 10001 10001",
  N: "10001 10001 11001 10101 10011 10001 10001",
  O: "01110 10001 10001 10001 10001 10001 01110",
  P: "11110 10001 10001 11110 10000 10000 10000",
  Q: "01110 10001 10001 10001 10101 10010 01101",
  R: "11110 10001 10001 11110 10100 10010 10001",
  S: "01111 10000 10000 01110 00001 00001 11110",
  T: "11111 00100 00100 00100 00100 00100 00100",
  U: "10001 10001 10001 10001 10001 10001 01110",
  V: "10001 10001 10001 10001 10001 01010 00100",
  W: "10001 10001 10001 10101 10101 10101 01010",
  X: "10001 10001 01010 00100 01010 10001 10001",
  Y: "10001 10001 01010 00100 00100 00100 00100",
  Z: "11111 00001 00010 00100 01000 10000 11111",
  "0": "01110 10001 10011 10101 11001 10001 01110",
  "1": "00100 01100 00100 00100 00100 00100 01110",
  "2": "01110 10001 00001 00010 00100 01000 11111",
  "3": "11111 00010 00100 00010 00001 10001 01110",
  "4": "00010 00110 01010 10010 11111 00010 00010",
  "5": "11111 10000 11110 00001 00001 10001 01110",
  "6": "00110 01000 10000 11110 10001 10001 01110",
  "7": "11111 00001 00010 00100 01000 01000 01000",
  "8": "01110 10001 10001 01110 10001 10001 01110",
  "9": "01110 10001 10001 01111 00001 00010 01100",
  "!": "00100 00100 00100 00100 00100 00000 00100",
  "?": "01110 10001 00001 00010 00100 00000 00100",
  ":": "00000 01100 01100 00000 01100 01100 00000",
  ".": "00000 00000 00000 00000 00000 01100 01100",
  ",": "00000 00000 00000 00000 01100 00100 01000",
  "'": "00100 00100 01000 00000 00000 00000 00000",
  "-": "00000 00000 00000 11111 00000 00000 00000",
  "/": "00001 00001 00010 00100 01000 10000 10000",
  "·": "00000 00000 00000 00100 00000 00000 00000",
  "%": "11000 11001 00010 00100 01000 10011 00011",
  "+": "00000 00100 00100 11111 00100 00100 00000",
  "#": "01010 11111 01010 01010 11111 01010 00000",
  "&": "01100 10010 10100 01000 10101 10010 01101",
  "(": "00010 00100 01000 01000 01000 00100 00010",
  ")": "01000 00100 00010 00010 00010 00100 01000",
  ">": "00000 00100 00010 11111 00010 00100 00000",
  "<": "00000 00100 01000 11111 01000 00100 00000",
  "←": "00000 00100 01000 11111 01000 00100 00000",
  "★": "00100 00100 11111 01110 01110 11011 00000",
  "↑": "00100 01110 10101 00100 00100 00100 00000",
  "↓": "00000 00100 00100 00100 10101 01110 00100",
  " ": "00000 00000 00000 00000 00000 00000 00000",
};
const ALIAS: Record<string, string> = { "\u00a0": " ", "–": "-", "—": "-", "→": ">", "’": "'" };
const ROWS = Object.fromEntries(
  Object.entries(GLYPHS).map(([c, bits]) => [
    c,
    bits.split(" ").map((r) => [...r].map((b) => b === "1")),
  ]),
);

export const GLYPH_H = 7;
const ADVANCE = 6; // five columns and one of space

const clean = (text: string) =>
  [...text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()].map((c) => {
    const ch = ALIAS[c] ?? c;
    return ch in ROWS ? ch : "?";
  });

export const textWidth = (text: string, scale = 1) =>
  Math.max(0, clean(text).length * ADVANCE - 1) * scale;

// The largest whole scale at which the text fits the width, between 1 and `max`.
export const fitScale = (text: string, width: number, max: number) =>
  Math.max(1, Math.min(max, Math.floor(width / Math.max(1, textWidth(text)))));

// Breaks the text into lines no wider than `width` at scale 1, on spaces.
export const wrap = (text: string, width: number) => {
  const per = Math.max(1, Math.floor((width + 1) / ADVANCE));
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > per && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
};

type Ink = string | readonly string[]; // one colour, or one per glyph row: lettering that shades
type Look = { outline?: string; shadow?: string; align?: "left" | "center" | "right" };

const paint = (
  ctx: CanvasRenderingContext2D,
  chars: string[],
  x: number,
  y: number,
  s: number,
  ink: Ink,
) => {
  chars.forEach((c, i) => {
    const rows = ROWS[c];
    rows.forEach((row: boolean[], ry: number) => {
      ctx.fillStyle = typeof ink === "string" ? ink : ink[Math.min(ink.length - 1, ry)];
      row.forEach((on, rx) => on && ctx.fillRect(x + (i * ADVANCE + rx) * s, y + ry * s, s, s));
    });
  });
};

const OUTLINE = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;

// Each lettering is painted once, pixel by pixel, into its own small canvas, then copied in one
// stroke every frame after: the HUD, the key strip and the cards repeat the same words.
const PAD = 1; // room for the outline
const cache = new Map<string, HTMLCanvasElement>();
const lettering = (chars: string[], w: number, scale: number, ink: Ink, look: Look) => {
  const key = `${chars.join("")}|${scale}|${typeof ink === "string" ? ink : ink.join()}|${look.outline ?? ""}|${look.shadow ?? ""}`;
  const known = cache.get(key);
  if (known) return known;
  const drop = look.shadow ? Math.max(2, scale) : 0;
  const c = document.createElement("canvas");
  c.width = Math.max(1, w + PAD * 2);
  c.height = GLYPH_H * scale + drop + PAD * 2;
  const g = c.getContext("2d");
  if (g) {
    if (look.shadow) paint(g, chars, PAD, PAD + drop, scale, look.shadow);
    if (look.outline)
      for (const [dx, dy] of OUTLINE) paint(g, chars, PAD + dx, PAD + dy, scale, look.outline);
    paint(g, chars, PAD, PAD, scale, ink);
  }
  if (cache.size > 400) cache.clear(); // a score that keeps changing must not grow it forever
  cache.set(key, c);
  return c;
};

// Draws text with its top at `y`. An outline sits one pixel around it, a shadow one pixel below.
export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  ink: Ink,
  look: Look = {},
) => {
  const chars = clean(text);
  const w = textWidth(text, scale);
  if (!chars.length) return w;
  const left = Math.round(look.align === "center" ? x - w / 2 : look.align === "right" ? x - w : x);
  ctx.drawImage(lettering(chars, w, scale, ink, look), left - PAD, Math.round(y) - PAD);
  return w;
};

// The same lettering as an SVG, for the controls that stay real buttons: one path of pixels,
// sized by the stage (`--op-px`) in CSS.
export const glyphSvg = (text: string) => {
  const chars = clean(text);
  let d = "";
  chars.forEach((c, i) =>
    ROWS[c].forEach((row: boolean[], y: number) =>
      row.forEach((on, x) => {
        if (on) d += `M${i * ADVANCE + x} ${y}h1v1h-1z`;
      }),
    ),
  );
  const w = Math.max(1, chars.length * ADVANCE - 1);
  return `<svg class="op-label" viewBox="0 0 ${w} ${GLYPH_H}" style="--w:${w}" aria-hidden="true" shape-rendering="crispEdges"><path d="${d}" /></svg>`;
};
