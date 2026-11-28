// The score chain and the rank, apart from the screen.
// Kills less than CHAIN seconds apart build a chain; the chain multiplies the score, up to ×8.
export const CHAIN = 1.6;
export const chainAfter = (chain: number, sinceLast: number) =>
  sinceLast <= CHAIN ? chain + 1 : 1;
export const multiplierOf = (chain: number) => Math.max(1, Math.min(8, chain));

export type Run = {
  readonly cleared: boolean;
  readonly continues: number;
  readonly deaths: number;
  readonly skills: number;
  readonly total: number;
  readonly accuracy: number; // 0 to 1
};
// A hard rank: S is the whole mission on one credit, at most one life lost, every skill, a sure hand.
export const rankOf = (run: Run) => {
  if (!run.cleared) return "-";
  if (run.continues > 0) return "C";
  if (run.deaths <= 1 && run.skills === run.total && run.accuracy >= 0.45) return "S";
  if (run.skills >= run.total - 1 && run.deaths <= 2) return "A";
  return "B";
};
