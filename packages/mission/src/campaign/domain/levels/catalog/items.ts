// What lies around, Little Fighter style: crouch and fire to grab, fire to throw, guard to use.
export type PropId = "coffee" | "duck" | "keyboard";
// caffeine: faster; debug: foes stop to listen, weak points show; none: not for drinking.
export type Use = "caffeine" | "debug" | "none";
export type Prop = {
  readonly name: string;
  readonly use: Use;
  readonly used: string; // said when used
  readonly damage: number;
  readonly splash: number; // stage pixels a throw splashes over, when it lands
  readonly bounces: number; // times a throw bounces off what it hits before it is spent
};

export const PROPS = {
  coffee: {
    name: "COFFEE",
    use: "caffeine",
    used: "CAFFEINATED!",
    damage: 3,
    splash: 14,
    bounces: 0,
  },
  duck: {
    name: "RUBBER DUCK",
    use: "debug",
    used: "RUBBER DUCK DEBUGGING: FOUND IT",
    damage: 2,
    splash: 0,
    bounces: 2,
  },
  keyboard: {
    name: "MECHANICAL KEYBOARD",
    use: "none",
    used: "YOU CAN'T DRINK A KEYBOARD",
    damage: 7,
    splash: 0,
    bounces: 0,
  },
} as const satisfies { [K in PropId]: Prop };

export const BUZZ = { caffeine: 6, debug: 4 } as const; // seconds a use lasts
