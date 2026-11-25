import type { PullRequest } from "./PullRequest.ts";

export type ContributionRules = {
  readonly user: string;
  readonly ownOrgs: readonly string[];
  readonly keepOrgs: readonly string[];
  readonly excludeRepos: readonly string[];
  readonly shownKinds: readonly string[];
  readonly trivial: RegExp;
};

const isOneOf = ({ word, words }: { word: string; words: readonly string[] }) =>
  words.some((other) => other.toLowerCase() === word.toLowerCase());

// What counts as a contribution.
export class ContributionPolicy {
  readonly #rules: ContributionRules;

  constructor(rules: ContributionRules) {
    this.#rules = rules;
  }

  // Work on one's own account, or on organisations one runs, is never a contribution.
  owners(): string[] {
    const { user, ownOrgs, keepOrgs } = this.#rules;
    return [user, ...ownOrgs].filter((word) => !isOneOf({ word, words: keepOrgs }));
  }

  isOwn({ repo }: PullRequest): boolean {
    return isOneOf({ word: repo.split("/")[0], words: this.owners() });
  }

  isSubstantive({ repo, title }: PullRequest): boolean {
    const { excludeRepos, trivial } = this.#rules;
    return !isOneOf({ word: repo, words: excludeRepos }) && !trivial.test(title);
  }

  isShown(kind: string): boolean {
    return this.#rules.shownKinds.includes(kind);
  }
}
