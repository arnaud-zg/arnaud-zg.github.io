import type { Issue, PullRequest } from "./PullRequest.ts";

export type ContributionRules = {
  readonly user: string;
  readonly ownOrgs: readonly string[];
  readonly keepOrgs: readonly string[];
  readonly excludeRepos: readonly string[];
  readonly shownKinds: readonly string[];
  readonly trivial: RegExp;
  // Work this recent is current activity; older merged work is the record.
  readonly recentMonths: number;
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

  // An issue one reported oneself.
  isReportedByUser({ author }: Issue): boolean {
    return isOneOf({ word: author, words: [this.#rules.user] });
  }

  // The first day of the recent window, as an ISO date: dates compare as text.
  since(now: Date): string {
    const months = this.#rules.recentMonths;
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, now.getUTCDate()),
    );
    return start.toISOString().slice(0, 10);
  }
}
