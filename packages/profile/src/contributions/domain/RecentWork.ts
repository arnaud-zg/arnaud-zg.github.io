import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { PullRequest, Records } from "./PullRequest.ts";
import { PullRequestTitle } from "./PullRequestTitle.ts";
import { shownPullRequests } from "./ShownChanges.ts";

export type Status = "merged" | "review";
// An issue one reported before fixing it: it folds into the pull request that closes it.
export type Report = { number: string; url: string };
export type Thread = {
  status: Status;
  title: string;
  url: string;
  date: string;
  reported: Report[];
};
type Work = { records: Records; policy: ContributionPolicy; since: string };

const reportOf = (url: string): Report => ({ number: url.split("/").at(-1) ?? "", url });

// What is happening now: pull requests merged or in review since `since`, newest first.
export class RecentWork {
  readonly #threads: readonly (Thread & { repo: string })[];
  readonly #records: Records;

  constructor({ records, policy, since }: Work) {
    const { prs, open, closes } = records;
    const isRecent = ({ date }: PullRequest) => date >= since;
    const threadOf = (status: Status) => (pr: PullRequest) => ({
      repo: pr.repo,
      status,
      title: new PullRequestTitle(pr.title).describe().title,
      url: pr.url,
      date: pr.date,
      reported: (closes[pr.url] ?? []).map(reportOf),
    });
    const shown = (some: readonly PullRequest[], status: Status) =>
      shownPullRequests({ prs: some, policy }).filter(isRecent).map(threadOf(status));
    this.#records = records;
    this.#threads = [...shown(prs, "merged"), ...shown(open, "review")].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }

  // "3 merged · 5 in review · 2 reported and fixed".
  figures() {
    const count = (status: Status) => this.#threads.filter((one) => one.status === status).length;
    const reported = new Set(
      this.#threads.flatMap(({ reported }) => reported.map(({ url }) => url)),
    );
    return { merged: count("merged"), review: count("review"), reported: reported.size };
  }

  // One entry per repository, the one with the latest activity first.
  byRepository() {
    return [...Map.groupBy(this.#threads, ({ repo }) => repo)].map(([repo, threads]) => ({
      repo,
      about: this.#records.repos[repo]?.about ?? "",
      threads: threads.map(({ status, title, url, date, reported }) => ({
        status,
        title,
        url,
        date,
        reported,
      })),
    }));
  }
}
