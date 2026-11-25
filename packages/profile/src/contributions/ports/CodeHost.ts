import type { Lines, PullRequest } from "../domain/PullRequest.ts";

export interface CodeHost {
  mergedPullRequests(asked: { author: string; outside: string[] }): Promise<PullRequest[]>;
  repository(name: string): Promise<{ stars: number; description: string }>;
  linesOf(pullRequestUrl: string): Promise<Lines>;
}
