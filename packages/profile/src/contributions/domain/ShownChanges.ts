import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { PullRequest } from "./PullRequest.ts";
import { PullRequestTitle } from "./PullRequestTitle.ts";

type Work = { prs: readonly PullRequest[]; policy: ContributionPolicy };
export type ShownChange = { repo: string; kind: string; year: number; url: string };

const changeOf = ({ repo, title, date, url }: PullRequest): ShownChange => {
  const { kind } = new PullRequestTitle(title).describe();
  return { repo, kind, year: Number(date.slice(0, 4)), url };
};

// A pull request that counts, and whose kind is shown.
export const isShownWork = ({ pr, policy }: { pr: PullRequest; policy: ContributionPolicy }) =>
  policy.isSubstantive(pr) && policy.isShown(new PullRequestTitle(pr.title).describe().kind);

export const shownPullRequests = ({ prs, policy }: Work): PullRequest[] =>
  prs.filter((pr) => isShownWork({ pr, policy }));

export const shownChanges = ({ prs, policy }: Work): ShownChange[] =>
  shownPullRequests({ prs, policy }).map(changeOf);
