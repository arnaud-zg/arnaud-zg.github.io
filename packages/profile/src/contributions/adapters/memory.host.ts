import type { Lines, PullRequest } from "../domain/PullRequest.ts";
import type { CodeHost } from "../ports/CodeHost.ts";

export type MemoryPullRequest = PullRequest & { readonly author: string; readonly lines: Lines };
export type MemoryRepository = { stars: number; description: string };
export type MemoryHost = {
  pullRequests: readonly MemoryPullRequest[];
  repositories: Readonly<Record<string, MemoryRepository | undefined>>;
};

const found = <T>({ value, name }: { value: T | undefined; name: string }): T => {
  if (value === undefined) throw new Error(`404 ${name}`);
  return value;
};

export const memoryHost = ({ pullRequests, repositories }: MemoryHost): CodeHost => ({
  mergedPullRequests({ author, outside }) {
    const isOutside = ({ repo }: PullRequest) => !outside.includes(repo.split("/")[0]);
    const own = pullRequests.filter((one) => one.author === author && isOutside(one));
    return Promise.resolve(own.map(({ repo, title, url, date }) => ({ repo, title, url, date })));
  },

  repository: (name) => Promise.resolve(repositories[name]).then((value) => found({ value, name })),

  linesOf: (url) =>
    Promise.resolve(pullRequests.find((one) => one.url === url)).then(
      (value) => found({ value, name: url }).lines,
    ),
});
