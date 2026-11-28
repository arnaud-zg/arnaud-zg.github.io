// Special moves, as in the brawlers of old: guard, a direction, an action, pressed quickly, and
// paid for with energy. Directions count from where the hero faces: forward, back. Add a move
// here and give it its effect in game.ts. They are secret: nothing on screen lists them, the
// player finds them, and the debrief counts how many.
import type { Key } from "../../input/domain/controls.ts";

export type Input = "forward" | "back" | "up" | "down" | "fire" | "jump" | "bomb" | "guard";
export type MoveId = "dash" | "blast" | "strike" | "rollback" | "force" | "revert";
export type Move = {
  readonly id: MoveId;
  readonly keys: readonly Input[];
  readonly cost: number;
  readonly shown: string;
};

export const MOVES: readonly Move[] = [
  { id: "dash", keys: ["guard", "forward", "fire"], cost: 30, shown: "F → S" }, // HOTFIX DASH
  { id: "blast", keys: ["guard", "down", "fire"], cost: 45, shown: "F ↓ S" }, // MERGE BLAST
  { id: "strike", keys: ["guard", "up", "bomb"], cost: 70, shown: "F ↑ D" }, // DEPLOY STRIKE
  { id: "rollback", keys: ["guard", "back", "jump"], cost: 20, shown: "F ← SPACE" }, // a dodge roll
  { id: "force", keys: ["guard", "forward", "forward", "fire"], cost: 50, shown: "F → → S" }, // GIT PUSH --FORCE
  { id: "revert", keys: ["guard", "down", "up", "fire"], cost: 40, shown: "F ↓ ↑ S" }, // GIT REVERT
];

export const WINDOW = 0.6; // seconds a run of keys may take
export const ENERGY = { max: 100, regen: 4, perKill: 8 } as const; // per second, per kill

export const inputOf = (key: Key, facing: 1 | -1): Input | undefined => {
  if (key === "left") return facing === -1 ? "forward" : "back";
  if (key === "right") return facing === 1 ? "forward" : "back";
  return key === "start" || key === "pause" ? undefined : key;
};

// Keeps the last keys pressed; a press that completes a move, in time, returns it. The longest
// move that matches wins, so a move never hides inside another.
export class Combos {
  private recent: { input: Input; at: number }[] = [];

  press(input: Input, at: number): Move | undefined {
    this.recent = [...this.recent.filter((r) => at - r.at <= WINDOW), { input, at }].slice(-4);
    const tail = this.recent.map((r) => r.input);
    const move = [...MOVES]
      .sort((a, b) => b.keys.length - a.keys.length)
      .find(
        (m) =>
          m.keys.length <= tail.length &&
          m.keys.every((k, i) => k === tail[tail.length - m.keys.length + i]),
      );
    if (move) this.recent = [];
    return move;
  }
}
