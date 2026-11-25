import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { PullRequest } from "./PullRequest.ts";
import { PullRequestTitle } from "./PullRequestTitle.ts";

type Work = { prs: readonly PullRequest[]; policy: ContributionPolicy };
export type ShownChange = { repo: string; kind: string; year: number; url: string };

const changeOf = ({ repo, title, date, url }: PullRequest): ShownChange => {
  const { kind } = new PullRequestTitle(title).describe();
  return { repo, kind, year: Number(date.slice(0, 4)), url };
};

// The pull requests that count, and whose kind is shown.
export const shownChanges = ({ prs, policy }: Work): ShownChange[] =>
  prs
    .filter((pullRequest) => policy.isSubstantive(pullRequest))
    .map(changeOf)
    .filter(({ kind }) => policy.isShown(kind));
