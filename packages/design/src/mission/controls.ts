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
