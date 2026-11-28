// The controls. The right hand keeps the arrows; the thumb jumps on Space; the left hand rests on
// S D F, the three actions side by side, which sit in the same place on QWERTY and AZERTY, as
// does P, to pause. Enter or Space moves the screens on.
export type Key =
  "left" | "right" | "up" | "down" | "jump" | "fire" | "bomb" | "guard" | "pause" | "start";

const KEYS: Partial<Record<string, Key>> = {
  arrowleft: "left",
  arrowright: "right",
  arrowup: "up",
  arrowdown: "down",
  " ": "jump",
  s: "fire",
  d: "bomb",
  f: "guard",
  p: "pause",
  enter: "start",
};
export const keyOf = (key: string): Key | undefined => KEYS[key.toLowerCase()];

// What the strip under the stage shows, in the order of the hands: the label names a word in
// the mission's labels.
export const STRIP = [
  ["← →", "keyMove"],
  ["↑", "keyAim"],
  ["↓", "keyCrouch"],
  ["SPACE", "keyJump"],
  ["S", "keyFire"],
  ["D", "keyBomb"],
  ["F", "keyGuard"],
  ["P", "keyPause"],
] as const;

// On a touch screen the controls get a deck of their own, never laid over the stage: under it
// when the phone stands upright, in two columns either side when it lies on its side (the
// stick on the left, the buttons on the right). Sizes in CSS pixels. Without touch, no deck.
export type Deck = {
  readonly mode: "none" | "bottom" | "side";
  readonly size: number; // the deck's height (bottom) or each column's width (side)
  readonly stage: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
  };
};
export const DECK = { bottom: [170, 240], side: [150, 210], share: 0.32 } as const;
const clamp = (n: number, [lo, hi]: readonly [number, number]) =>
  Math.round(Math.max(lo, Math.min(hi, n)));

export const deckOf = (width: number, height: number, touch: boolean): Deck => {
  if (!touch) return { mode: "none", size: 0, stage: { x: 0, y: 0, w: width, h: height } };
  if (height >= width) {
    const size = clamp(height * DECK.share, DECK.bottom);
    return { mode: "bottom", size, stage: { x: 0, y: 0, w: width, h: height - size } };
  }
  const size = clamp(width * 0.2, DECK.side);
  return { mode: "side", size, stage: { x: size, y: 0, w: width - size * 2, h: height } };
};

// How many screen pixels a stage pixel takes, for a stage area: as big as fits, 2 to 5.
export const scaleOf = (w: number, h: number) =>
  Math.max(2, Math.min(5, Math.floor(Math.min(w / 300, h / 190))));

// The smallest stage it plays on (an iPhone SE either way, bars included); below, it says sorry.
export const FLOOR = { width: 170, height: 140 } as const;
export const playable = ({ width, height }: { width: number; height: number }) =>
  width >= FLOOR.width && height >= FLOOR.height;
