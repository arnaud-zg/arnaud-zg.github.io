import type { Issue, Lines, PullRequest } from "../domain/PullRequest.ts";

type Asked = { author: string; outside: string[] };

export interface CodeHost {
  mergedPullRequests(asked: Asked): Promise<PullRequest[]>;
  // Still open: dated by when they were opened.
  openPullRequests(asked: Asked): Promise<PullRequest[]>;
  // The issues each pull request closes when it merges, by its address. One request for all.
  issuesClosedBy(pullRequestUrls: string[]): Promise<Record<string, Issue[]>>;
  repository(name: string): Promise<{ description: string }>;
  linesOf(pullRequestUrl: string): Promise<Lines>;
  // Everything the user's contribution calendar counts in that calendar year.
  contributionsIn(asked: { user: string; year: number }): Promise<number>;
}
