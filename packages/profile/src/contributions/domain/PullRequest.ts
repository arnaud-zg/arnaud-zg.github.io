export type PullRequest = {
  readonly repo: string;
  readonly title: string;
  readonly url: string;
  readonly date: string;
};
export type Repository = { readonly about: string };
export type Repositories = Readonly<Record<string, Repository | undefined>>;
export type Lines = readonly [added: number, removed: number];
export type LinesByUrl = Readonly<Record<string, Lines | undefined>>;
// What is known of the work, and what is saved between builds.
export type Records = { prs: readonly PullRequest[]; repos: Repositories; lines: LinesByUrl };
