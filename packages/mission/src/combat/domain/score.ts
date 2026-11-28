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
  readonly debt: number;
};
// A hard rank: S is one credit, one life lost at most, every skill, a sure hand, next to no debt.
export const rankOf = (run: Run) => {
  if (!run.cleared) return "-";
  if (run.continues > 0) return "C";
  const clean = run.deaths <= 1 && run.skills === run.total && run.accuracy >= 0.45;
  if (clean && run.debt <= 2) return "S";
  if (run.skills >= run.total - 1 && run.deaths <= 2) return "A";
  return "B";
};

// The review after a map: each row an engineering metric with a real rule, worth points.
export type ReviewId =
  "coverage" | "incidents" | "leadTime" | "knowledge" | "quality" | "combo" | "interest";
export type Verdict = "praise" | "meh" | "roast";
export type ReviewRow = {
  readonly id: ReviewId;
  readonly detail: string;
  readonly points: number;
  readonly verdict: Verdict;
};
export type MapRun = {
  readonly fired: number;
  readonly landed: number;
  readonly deaths: number;
  readonly seconds: number;
  readonly par: number; // the level's target time, seconds
  readonly skills: number;
  readonly total: number;
  readonly bestChain: number;
  readonly exercises: { readonly asked: number; readonly solved: number; readonly points: number };
  readonly debt: number;
  readonly stage: number; // 0 for the first map of the run
};
export type Weights = {
  readonly coverage: { readonly floor: number; readonly perPoint: number };
  readonly incidents: number;
  readonly leadTime: number;
  readonly knowledge: { readonly perSkill: number; readonly all: number };
  readonly combo: number;
  readonly interest: { readonly perDebt: number; readonly compound: number };
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const verdictOf = (ratio: number): Verdict =>
  ratio >= 0.75 ? "praise" : ratio >= 0.35 ? "meh" : "roast";
const clock = (seconds: number) => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const row = ({
  id,
  detail,
  points,
  ratio,
}: {
  id: ReviewId;
  detail: string;
  points: number;
  ratio: number;
}) => {
  const built: ReviewRow = {
    id,
    detail,
    points: Math.round(points) + 0,
    verdict: verdictOf(ratio),
  }; // + 0: no -0
  return built;
};

type Rule = (args: { run: MapRun; weights: Weights }) => ReviewRow | undefined;

// Accuracy above the floor earns per point; a map that asked no exercise has no code review.
const RULES = {
  coverage: ({ run, weights }) => {
    const accuracy = run.landed / Math.max(1, run.fired);
    const percent = Math.round(accuracy * 100);
    const above = Math.max(0, percent - weights.coverage.floor * 100);
    const ratio = clamp01((accuracy - weights.coverage.floor) / (0.8 - weights.coverage.floor));
    return row({
      id: "coverage",
      detail: `${percent}%`,
      points: above * weights.coverage.perPoint,
      ratio,
    });
  },
  incidents: ({ run, weights }) => {
    const ratio = 1 / 2 ** run.deaths;
    return row({
      id: "incidents",
      detail: String(run.deaths),
      points: weights.incidents * ratio,
      ratio,
    });
  },
  leadTime: ({ run, weights }) => {
    const ratio = clamp01((2 * run.par - run.seconds) / run.par);
    const detail = `${clock(run.seconds)}/${clock(run.par)}`;
    return row({ id: "leadTime", detail, points: weights.leadTime * ratio, ratio });
  },
  knowledge: ({ run, weights }) => {
    const ratio = run.skills / Math.max(1, run.total);
    const all = run.total > 0 && run.skills === run.total ? weights.knowledge.all : 1;
    const points = run.skills * weights.knowledge.perSkill * all;
    return row({ id: "knowledge", detail: `${run.skills}/${run.total}`, points, ratio });
  },
  quality: ({ run }) => {
    const { asked, solved, points } = run.exercises;
    if (asked === 0) return undefined;
    return row({ id: "quality", detail: `${solved}/${asked}`, points, ratio: solved / asked });
  },
  combo: ({ run, weights }) => {
    const chain = run.bestChain >= 2 ? run.bestChain : 0;
    return row({
      id: "combo",
      detail: `X${chain}`,
      points: chain * weights.combo,
      ratio: clamp01(chain / 8),
    });
  },
  // Debt compounds: the same shortcut costs more on every map after the one it was taken on.
  interest: ({ run, weights }) => {
    const owed = run.debt * weights.interest.perDebt * weights.interest.compound ** run.stage;
    return row({
      id: "interest",
      detail: String(run.debt),
      points: -owed,
      ratio: 1 / (1 + run.debt),
    });
  },
} as const satisfies { [K in ReviewId]: Rule };

export const REVIEW_ORDER: readonly ReviewId[] = [
  "coverage",
  "incidents",
  "leadTime",
  "knowledge",
  "quality",
  "combo",
  "interest",
];

export const reviewOf = (args: { run: MapRun; weights: Weights }) =>
  REVIEW_ORDER.map((id) => RULES[id](args)).filter((r) => r !== undefined);

export const bonusOf = (rows: readonly ReviewRow[]) => rows.reduce((sum, r) => sum + r.points, 0);
