export type PullRequest = {
  readonly repo: string;
  readonly title: string;
  readonly url: string;
  // When it was merged, or opened while it is still in review.
  readonly date: string;
};
export type Issue = { readonly url: string; readonly author: string };
export type Repository = { readonly about: string };
export type Repositories = Readonly<Record<string, Repository | undefined>>;
export type Lines = readonly [added: number, removed: number];
export type LinesByUrl = Readonly<Record<string, Lines | undefined>>;
// The issues one reported and then closed with one's own pull request, by its address.
export type ClosedIssues = Readonly<Record<string, readonly string[] | undefined>>;
// The profile's "contributions in the last year", on the day it was read. Without that day, the
// total is a calendar year's, saved before: not the last year's.
export type YearOfContributions = { readonly total: number; readonly asOf?: string };
// What is known of the work, and what is saved between builds. `prs` are merged, `open` in review.
export type Records = {
  prs: readonly PullRequest[];
  open: readonly PullRequest[];
  closes: ClosedIssues;
  repos: Repositories;
  lines: LinesByUrl;
  contributions: YearOfContributions;
};
