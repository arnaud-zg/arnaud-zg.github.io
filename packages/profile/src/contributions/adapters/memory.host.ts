import type { Issue, Lines, PullRequest } from "../domain/PullRequest.ts";
import type { CodeHost } from "../ports/CodeHost.ts";

export type MemoryPullRequest = PullRequest & {
  readonly author: string;
  readonly lines: Lines;
  // Merged unless said otherwise.
  readonly open?: boolean;
  readonly closes?: readonly Issue[];
};
export type MemoryRepository = { description: string };
export type MemoryHost = {
  pullRequests: readonly MemoryPullRequest[];
  repositories: Readonly<Record<string, MemoryRepository | undefined>>;
};

const found = <T>({ value, name }: { value: T | undefined; name: string }): T => {
  if (value === undefined) throw new Error(`404 ${name}`);
  return value;
};

export const memoryHost = ({ pullRequests, repositories }: MemoryHost): CodeHost => {
  const byAuthor = (open: boolean, { author, outside }: { author: string; outside: string[] }) => {
    const isOutside = ({ repo }: PullRequest) => !outside.includes(repo.split("/")[0]);
    const own = pullRequests.filter(
      (one) => one.author === author && isOutside(one) && Boolean(one.open) === open,
    );
    return Promise.resolve(own.map(({ repo, title, url, date }) => ({ repo, title, url, date })));
  };

  return {
    mergedPullRequests: (asked) => byAuthor(false, asked),
    openPullRequests: (asked) => byAuthor(true, asked),

    issuesClosedBy: (urls) =>
      Promise.resolve(
        Object.fromEntries(
          urls.map((url) => [
            url,
            [...(pullRequests.find((one) => one.url === url)?.closes ?? [])],
          ]),
        ),
      ),

    repository: (name) =>
      Promise.resolve(repositories[name]).then((value) => found({ value, name })),

    linesOf: (url) =>
      Promise.resolve(pullRequests.find((one) => one.url === url)).then(
        (value) => found({ value, name: url }).lines,
      ),
  };
};
