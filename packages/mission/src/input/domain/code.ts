// What starts the mission: the Konami code, typed or swiped. Pure, so the page ships only this
// (and the listener in arcade/adapters/dom.trigger.ts) until the code is in.
export type CodeKey = "up" | "down" | "left" | "right" | "b" | "a" | "tap";

// ↑ ↑ ↓ ↓ ← → ← → B A. On a touch screen the arrows are swipes and B and A are taps.
const CODE: readonly CodeKey[] = [
  "up",
  "up",
  "down",
  "down",
  "left",
  "right",
  "left",
  "right",
  "b",
  "a",
];

export const pushCode = (history: readonly CodeKey[], key: CodeKey) => {
  const next = [...history, key].slice(-CODE.length);
  const done =
    next.length === CODE.length && next.every((k, i) => k === CODE[i] || (k === "tap" && i >= 8));
  return { history: done ? [] : next, done };
};

const KEYS: Record<string, CodeKey> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  b: "b",
  B: "b",
  a: "a",
  A: "a",
};
export const keyOf = (key: string): CodeKey | undefined => KEYS[key];

// A finger that moves less than `min` pixels taps; otherwise it swipes the way it went most.
export const swipeOf = (dx: number, dy: number, min = 30): CodeKey => {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return "tap";
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
};
