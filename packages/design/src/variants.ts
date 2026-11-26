// A component's variants, written once: the component reads its props from them and puts them on its
// root as data attributes (`data-size="banner"`), its styles select them (`.hero[data-size="banner"]`),
// and the workshop lists every combination. No classes to build, no dependency.
export type Axes = Readonly<Record<string, readonly [string, ...string[]]>>;
export type Choice<A extends Axes> = { [K in keyof A]: A[K][number] };

export type Variants<A extends Axes> = {
  readonly axes: A;
  readonly defaults: Choice<A>;
  // The data attributes of a choice, defaults filled in.
  attrs(choice?: Partial<Choice<A>>): Record<`data-${string}`, string>;
  // Every combination, defaults first.
  all(): Choice<A>[];
};

export const defineVariants = <const A extends Axes>(
  axes: A,
  defaults: Choice<A>,
): Variants<A> => ({
  axes,
  defaults,
  attrs: (choice = {}) =>
    Object.fromEntries(
      Object.keys(axes).map((axis) => [`data-${axis}`, String(choice[axis] ?? defaults[axis])]),
    ) as Record<`data-${string}`, string>,
  all: () =>
    Object.entries(axes).reduce<Choice<A>[]>(
      (combos, [axis, values]) =>
        combos.flatMap((combo) =>
          [defaults[axis], ...values.filter((v) => v !== defaults[axis])].map((value) => ({
            ...combo,
            [axis]: value,
          })),
        ),
      [{} as Choice<A>],
    ),
});
