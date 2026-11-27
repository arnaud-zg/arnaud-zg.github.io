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
  // What the user's profile shows a visitor: contributions in the last year, private ones included.
  contributionsInLastYear(user: string): Promise<number>;
}
