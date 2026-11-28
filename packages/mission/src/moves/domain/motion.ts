// How the hero's jump feels, apart from the screen. Arcade games forgive a little: a jump
// pressed just after walking off a ledge still jumps (coyote time), a jump pressed just before
// landing jumps on landing (the buffer), and letting go of the key early makes a short hop.
export const JUMP = {
  speed: 178, // stage pixels per second, upwards
  coyote: 0.09, // seconds after leaving the ground a jump still counts
  buffer: 0.13, // seconds a press waits for the ground
  cut: 0.45, // the share of the rise kept when the key is let go early
} as const;

export class Jumper {
  private airborne = -Infinity; // when the hero last left the ground without jumping
  private pressed = -Infinity; // when jump was last pressed, not yet used
  private rising = false; // the jump key is still held on the way up

  // The hero stands on something, or does not; `now` in seconds.
  ground(on: boolean, now: number) {
    if (on) this.airborne = Infinity;
    else if (this.airborne === Infinity) this.airborne = now;
  }

  press(now: number) {
    this.pressed = now;
  }

  // Whether a jump starts now: a press waiting, and the ground under the hero or only just gone.
  // A jump that starts uses the press and the ground.
  take(now: number, onGround: boolean) {
    const waiting = now - this.pressed <= JUMP.buffer;
    const footing = onGround || now - this.airborne <= JUMP.coyote;
    if (!waiting || !footing) return false;
    this.pressed = -Infinity;
    this.airborne = -Infinity;
    this.rising = true;
    return true;
  }

  // The key is let go: the rise, if still going, is cut short. Returns the new vertical speed.
  release(vy: number) {
    if (!this.rising) return vy;
    this.rising = false;
    return vy < 0 ? Math.max(vy, -JUMP.speed * JUMP.cut) : vy;
  }

  // A drop through a ledge, or a fall that was not a jump: nothing to cut.
  fall() {
    this.rising = false;
  }
}

// Things on the ground drift to a hero close by, so a pickup is never missed by a pixel.
export const MAGNET = { reach: 22, pull: 90 } as const;
export const pullToward = (from: number, to: number, dt: number) => {
  const d = to - from;
  if (Math.abs(d) > MAGNET.reach) return from;
  return from + Math.sign(d) * Math.min(Math.abs(d), MAGNET.pull * dt);
};

// A short freeze on a heavy blow, as in the brawlers: the bigger the blow, the longer, capped.
export const HITSTOP = { kill: 0.035, heavy: 0.06, boss: 0.14, max: 0.16 } as const;
export const stopFor = (current: number, add: number) =>
  Math.min(HITSTOP.max, Math.max(current, add));

// Which way a signed step points: left below zero, right otherwise.
export const sideOf = (step: number): 1 | -1 => (step < 0 ? -1 : 1);
