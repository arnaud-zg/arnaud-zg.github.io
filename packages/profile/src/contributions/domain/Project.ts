import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { PullRequest, Repository } from "./PullRequest.ts";
import { PullRequestTitle } from "./PullRequestTitle.ts";

type Change = { title: string; kind: string; year: number; url: string };
export type ProjectFacts = {
  name: string;
  repository: Repository;
  pullRequests: readonly PullRequest[];
  policy: ContributionPolicy;
};

const FADES_AFTER_YEARS = 4;
const changeOf = ({ title, date, url }: PullRequest): Change => {
  const described = new PullRequestTitle(title).describe();
  return { ...described, year: Number(date.slice(0, 4)), url };
};

export class Project {
  readonly #name: string;
  readonly #repository: Repository;
  readonly #policy: ContributionPolicy;
  readonly #changes: readonly Change[];

  constructor({ name, repository, pullRequests, policy }: ProjectFacts) {
    this.#name = name;
    this.#repository = repository;
    this.#policy = policy;
    this.#changes = this.#ranked(pullRequests.map(changeOf));
  }

  isEmpty(): boolean {
    return !this.#changes.length;
  }

  // What was contributed, by the project's reach and how recent it is.
  scoreIn(year: number): number {
    const weights = this.#changes.slice(0, 2).map(({ kind }) => this.#policy.weightOf(kind));
    const substance = weights.reduce((total, weight) => total + weight, 0);
    const latest = Math.max(...this.#changes.map((change) => change.year));
    const freshness = Math.max(0, FADES_AFTER_YEARS - (year - latest));
    return substance * Math.log10(this.#repository.stars + 10) + freshness;
  }

  shown() {
    const { about } = this.#repository;
    const shown = this.#changes.filter(({ kind }) => this.#policy.isShown(kind));
    return shown.map((change) => ({ ...change, repo: this.#name, about }));
  }

  #ranked(changes: Change[]): Change[] {
    const weight = ({ kind }: Change) => this.#policy.weightOf(kind);
    return changes
      .filter(({ kind }) => kind !== "Docs")
      .sort((a, b) => weight(b) - weight(a) || b.year - a.year);
  }
}
