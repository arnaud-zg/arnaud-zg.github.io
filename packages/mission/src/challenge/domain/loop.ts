// Each CI cannon shot waits for its build; skipping tests makes it instant, and ships bugs.
export type LoopStage = {
  readonly label: string;
  readonly eta: string;
  readonly build: number; // seconds a shot waits
  readonly flaky: number; // chance a build fails for nothing and must run again
  readonly backfire: number; // chance the shot ships a bug instead
};

export type Loop = { readonly stage: number; readonly skipped: boolean };

export const stageOf = ({
  loop,
  stages,
  skipped,
}: {
  loop: Loop;
  stages: readonly LoopStage[];
  skipped: LoopStage;
}) => (loop.skipped ? skipped : (stages.at(Math.min(loop.stage, stages.length - 1)) ?? skipped));

export type Shot = "fire" | "flaky" | "backfire";

// One roll in [0, 1) decides a shot: a bug first, then a flake, else it fires.
export const shotOf = ({ stage, roll }: { stage: LoopStage; roll: number }): Shot => {
  if (roll < stage.backfire) return "backfire";
  if (roll < stage.backfire + stage.flaky) return "flaky";
  return "fire";
};

export const faster = (loop: Loop): Loop => ({ ...loop, stage: loop.stage + 1 });
export const skipTests = (loop: Loop): Loop => ({ ...loop, skipped: true });
