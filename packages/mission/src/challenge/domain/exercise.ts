// A quiz pays for right answers, faster pays more; a decision has none, only consequences.
export type Perk = "bombs" | "weapon" | "language" | "faster" | "skipTests";
export type Gag = "overflow";

export type Choice = {
  readonly text: string;
  readonly says: string; // what the colleague answers
  readonly right?: boolean;
  readonly debt?: number; // owed (decisions), or paid back when negative
  readonly perk?: Perk;
  readonly names?: boolean; // the choice is the name the run's context goes by
  readonly gag?: Gag;
};

export type Figure =
  | { readonly kind: "tree"; readonly values: readonly number[]; readonly path: readonly number[] }
  | { readonly kind: "lockers"; readonly lockers: number; readonly items: readonly Locker[] }
  | { readonly kind: "dolls"; readonly labels: readonly string[] }
  | { readonly kind: "race"; readonly racers: readonly Racer[] }
  | { readonly kind: "trace"; readonly lines: readonly string[] };
export type Locker = { readonly key: string; readonly locker?: number };
export type Growth = "constant" | "log" | "linear" | "nlogn" | "square";
export type Racer = { readonly label: string; readonly grows: Growth };

export type Step = {
  readonly ask: string;
  readonly choices: readonly Choice[];
  readonly figure?: Figure;
  readonly arrows?: boolean; // ← and → pick the first and second choice: a left or right turn
};

// An incident is graded like a quiz: solved, production is fixed; not, the game runs degraded.
export type Exercise = {
  readonly id: string;
  readonly kind: "quiz" | "decision" | "incident";
  readonly skin?: "whiteboard" | "terminal";
  readonly title: string;
  readonly speaker: string;
  readonly intro: string;
  readonly steps: readonly Step[];
  readonly points: number; // a quiz answered right and at once
  readonly time: number; // seconds on the standup timer, per step
};

export type Answer = { readonly choice: Choice | undefined; readonly seconds: number }; // undefined: the timer ran out

// The work a growth curve does for n items, to race them on screen.
const WORK = {
  constant: () => 1,
  log: (n: number) => Math.log2(Math.max(2, n)),
  linear: (n: number) => n,
  nlogn: (n: number) => n * Math.log2(Math.max(2, n)),
  square: (n: number) => n * n,
} as const satisfies { [K in Growth]: (n: number) => number };
export const workOf = ({ grows, n }: { grows: Growth; n: number }) => WORK[grows](n);

// A right answer pays from half, at the buzzer, to all of it, at once.
const speedOf = ({ seconds, time }: { seconds: number; time: number }) =>
  0.5 + 0.5 * Math.max(0, Math.min(1, 1 - seconds / time));

export const resultOf = ({
  exercise,
  answers,
}: {
  exercise: Exercise;
  answers: readonly Answer[];
}) => {
  const chosen = answers.map((a) => a.choice).filter((c) => c !== undefined);
  const rightOnes = answers.filter((a) => a.choice?.right === true);
  const share = rightOnes.reduce(
    (sum, a) => sum + speedOf({ seconds: a.seconds, time: exercise.time }),
    0,
  );
  const graded = exercise.kind !== "decision";
  return {
    solved: graded && rightOnes.length === exercise.steps.length,
    points: graded ? Math.round((exercise.points * share) / exercise.steps.length) : 0,
    debt: chosen.reduce((sum, c) => sum + (c.debt ?? 0), 0),
    perks: chosen.map((c) => c.perk).filter((p) => p !== undefined),
    name: chosen.find((c) => c.names)?.text,
  };
};
