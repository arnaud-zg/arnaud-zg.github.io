import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { PullRequest, Records } from "./PullRequest.ts";
import type { Thread } from "./RecentWork.ts";
import { RecentWork } from "./RecentWork.ts";
import { shownPullRequests } from "./ShownChanges.ts";

type Work = { records: Records; policy: ContributionPolicy; since: string };
export type RepositoryWork = {
  repo: string;
  about: string;
  // The years it spans, from the first merge to the latest activity.
  from: number;
  to: number;
  merged: number;
  review: number;
  // Lines of merged work only: what is in review may still change.
  added: number;
  removed: number;
  // Lines of the pull requests in review, apart: left out when none is known (an older snapshot).
  pending?: { added: number; removed: number };
  // What is happening there now, newest first.
  threads: Thread[];
};

const yearOf = ({ date }: { date: string }) => Number(date.slice(0, 4));

// The whole record, by repository: what the code added and removed, the years it spans, and the
// pull requests of the last months. The repository with the latest activity first.
export class OpenSource {
  readonly #repos: readonly RepositoryWork[];

  constructor({ records, policy, since }: Work) {
    const { prs, repos, lines } = records;
    const merged = shownPullRequests({ prs, policy });
    const recent = new RecentWork({ records, policy, since }).byRepository();
    const now = new Map(recent.map(({ repo, threads }) => [repo, threads]));
    const byRepo = Map.groupBy(merged, ({ repo }) => repo);
    const names = new Set([...byRepo.keys(), ...now.keys()]);
    const latest = new Map<string, string>();
    const work = [...names].map((repo): RepositoryWork => {
      const done: readonly PullRequest[] = byRepo.get(repo) ?? [];
      const threads = now.get(repo) ?? [];
      const dated = [...done, ...threads];
      latest.set(
        repo,
        dated
          .map(({ date }) => date)
          .sort()
          .at(-1) ?? "",
      );
      const years = dated.map(yearOf);
      const total = (side: 0 | 1, some: readonly { url: string }[]) =>
        some.reduce((sum, { url }) => sum + (lines[url]?.[side] ?? 0), 0);
      const inReview = threads.filter(({ status, url }) => status === "review" && lines[url]);
      const pending = { added: total(0, inReview), removed: total(1, inReview) };
      return {
        repo,
        about: repos[repo]?.about ?? "",
        from: Math.min(...years),
        to: Math.max(...years),
        merged: done.length,
        review: threads.filter(({ status }) => status === "review").length,
        added: total(0, done),
        removed: total(1, done),
        ...(pending.added + pending.removed > 0 ? { pending } : {}),
        threads,
      };
    });
    const when = (repo: string) => latest.get(repo) ?? "";
    this.#repos = work.sort((a, b) => when(b.repo).localeCompare(when(a.repo)));
  }

  byRepository(): RepositoryWork[] {
    return [...this.#repos];
  }

  // "+1,204 −310 lines · 9 projects · 2019–2026".
  figures() {
    const sum = (side: "added" | "removed") =>
      this.#repos.reduce((total, repo) => total + repo[side], 0);
    const from = Math.min(...this.#repos.map((repo) => repo.from));
    const to = Math.max(...this.#repos.map((repo) => repo.to));
    const span = this.#repos.length ? { from, to } : undefined;
    return { added: sum("added"), removed: sum("removed"), projects: this.#repos.length, ...span };
  }
}
