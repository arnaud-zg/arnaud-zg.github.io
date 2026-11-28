// The mission's pixel art, drawn for it: one character per pixel, "." for none. Each sprite is
// painted once to its own small canvas, with a white copy for the flash of a hit.

// A desert sortie: sand, khaki, olive and rust, soot outlines. The hero wears a grey t-shirt
// and dark blue trousers.
export const INK = {
  soot: "#1b1410",
  sand: "#e8c37a",
  sandLight: "#f6dea4",
  khaki: "#b89a5a",
  khakiDark: "#8a6f3e",
  olive: "#56642c",
  rust: "#b5532c",
  ember: "#e2702d",
  gold: "#ffd447",
  goldLight: "#fff3b0",
  cream: "#efe2c0",
  stone: "#8b8f99",
  stoneLight: "#b7bbc4",
  stoneDark: "#5a5e68",
  mortar: "#3c3f47",
  violet: "#6b3fc4",
  violetLight: "#9b72ee",
  white: "#ffffff",
};
// Shaded lettering, top to bottom: the arcade banner, and the warning.
export const GOLD = [
  INK.goldLight,
  INK.goldLight,
  INK.gold,
  INK.gold,
  INK.gold,
  INK.ember,
  INK.ember,
];

const PALETTE: Record<string, string> = {
  k: INK.soot,
  h: "#3a2620", // hair
  s: "#f1bf91", // skin
  G: "#4b4f5a", // headphones, gun
  g: "#7b808c",
  v: "#8e949e", // a grey t-shirt
  V: "#b4b9c2",
  P: "#1b2440", // belt
  p: "#263a66", // dark blue trousers
  b: "#5a3b26", // boots
  w: "#d29a55", // wood
  W: "#8a5a2b",
  c: INK.cream,
  r: INK.rust,
  R: "#c2452d", // a bug's shell
  y: "#f08a5d",
  e: INK.white,
};

// The developer, facing right, arms drawn apart so they can aim anywhere. 16 × 15, legs below.
const BODY = [
  "....kkkkkk......",
  "...khhhhhhk.....",
  "..khhhhhhhhk....",
  ".kGhhhhhhhhhk...",
  ".kGkhhssssssk...",
  ".kGkhsskssksk...",
  ".kGkhsssssssk...",
  "..kvhssssssk....",
  "..kvkkssskk.....",
  "..kvvvvvvvvk....",
  ".kvVvvvvvvvvk...",
  ".kvVvvvvvvvvk...",
  ".kvVvvvvvvvk....",
  "..kvvvvvvvk.....",
  "..kPPPPPPPk.....",
];
const STAND = [
  "..kppppppk......",
  "..kppkkppk......",
  "..kpk..kpk......",
  "..kpk..kpk......",
  ".kbbk.kbbk......",
  ".kkkk.kkkk......",
];
const STRIDE = [
  "..kppppppk......",
  ".kppk.kppk......",
  "kpk....kpk......",
  "kbk.....kpk.....",
  "kbbk....kbbk....",
  "kkk.....kkkk....",
];
const PASS = [
  "..kppppppk......",
  "...kppppk.......",
  "...kpkpk........",
  "...kpkpk........",
  "..kbbkbbk.......",
  "..kkkkkkk.......",
];
// In the air, knees tucked.
const TUCK = [
  "..kppppppk......",
  "..kpppppppk.....",
  "...kkpkkppk.....",
  "....kbbkbbk.....",
  "....kkkkkkk.....",
  "................",
];
// Crouched: the head drops onto the shoulders, the knees fold. 16 rows, not 21.
const CROUCH = [
  ...BODY.slice(0, 10),
  ...BODY.slice(12),
  ".kppppppppk.....",
  "kbbkk..kbbk.....",
  "kkkk...kkkk.....",
];
export const HERO = { w: 16, h: 21, crouchH: 16, shoulder: { x: 8, y: 10 }, crouchShoulder: 9 };

const CRATE_ROWS = [
  "kkkkkkkkkkkk",
  "kwwwwwwwwwwk",
  "kWWwwwwwwWWk",
  "kwWWwwwwWWwk",
  "kwwWWwwWWwwk",
  "kwwwWWWWwwwk",
  "kwwWWwwWWwwk",
  "kwWWwwwwWWwk",
  "kWWwwwwwwWWk",
  "kwwwwwwwwwwk",
  "kkkkkkkkkkkk",
];
const CHUTE_ROWS = [
  "....kkkkkkkkkk....",
  "..kcccrrrcccrrrk..",
  ".kcccrrrcccrrrcck.",
  "kcccrrrcccrrrcccrk",
  "kkkkkkkkkkkkkkkkkk",
];
const BUG_TOP = ["...kkkk...", ".kkRRRRk..", "keRRyRRRRk", "kRRRRRRRRk", ".kkkkkkkk."];

// A canvas's 2D context; every browser that runs the mission has one.
export const paper = (c: HTMLCanvasElement) => {
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("The mission needs a 2D canvas");
  return ctx;
};

type Sheet = { img: HTMLCanvasElement; flash: HTMLCanvasElement; w: number; h: number };
const sheet = (rows: readonly string[]): Sheet => {
  const w = rows[0].length,
    h = rows.length;
  const draw = (white: boolean) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = paper(c);
    rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === ".") return;
        x.fillStyle = white ? INK.white : PALETTE[ch];
        x.fillRect(rx, ry, 1, 1);
      }),
    );
    return c;
  };
  return { img: draw(false), flash: draw(true), w, h };
};

export const sprites = () => ({
  hero: [STAND, STRIDE, PASS, TUCK].map((legs) => sheet([...BODY, ...legs])),
  crouch: sheet(CROUCH),
  crate: sheet(CRATE_ROWS),
  chute: sheet(CHUTE_ROWS),
  bug: [".k.k..k.k.", "k.k..k.k.."].map((legs) => sheet([...BUG_TOP, legs])),
});
export type Sprites = ReturnType<typeof sprites>;

// The arm and the gun, as one chunky line from the shoulder: sleeve, hand, then the barrel.
export const ARM = [
  "#8e949e",
  "#8e949e",
  "#8e949e",
  PALETTE.s,
  PALETTE.s,
  PALETTE.G,
  PALETTE.g,
  PALETTE.g,
  PALETTE.G,
  PALETTE.G,
];

// A terminal's colours: green on black, the prompt dimmer, errors red.
export const TERM = { bg: "#050a05", ink: "#7cff6b", dim: "#3c8a35", alert: "#ff5a4a" } as const;
