import type { ContributionPolicy } from "../domain/ContributionPolicy.ts";
import type { ClosedIssues, PullRequest, Records, Repository } from "../domain/PullRequest.ts";
import type { CodeHost } from "../ports/CodeHost.ts";
import { aboutFrom } from "../domain/about.ts";
import { shownChanges, shownPullRequests } from "../domain/ShownChanges.ts";

export type ContributionLogNeeds = {
  host: CodeHost;
  policy: ContributionPolicy;
  author: string;
  now: Date;
};

export class ContributionLog {
  readonly #needs: ContributionLogNeeds;

  constructor(needs: ContributionLogNeeds) {
    this.#needs = needs;
  }

  // Only what the page shows is asked for and saved: about 30 requests of GitHub's 5,000 an hour.
  // Lines are read for the pull requests in review too: the page draws them apart, as pending.
  async read(): Promise<Records> {
    const { host, policy, author, now } = this.#needs;
    const asked = { author, outside: policy.owners() };
    const [merged, opened] = await Promise.all([
      host.mergedPullRequests(asked),
      host.openPullRequests(asked),
    ]);
    if (!merged.length) throw new Error("no pull requests");
    const isOutside = (pr: PullRequest) => !policy.isOwn(pr);
    const outside = merged.filter(isOutside);
    const urls = new Set(shownChanges({ prs: outside, policy }).map(({ url }) => url));
    const prs = outside.filter(({ url }) => urls.has(url));
    // An open pull request older than the window has gone stale: it is not activity.
    const since = policy.since(now);
    const isRecent = ({ date }: PullRequest) => date >= since;
    const open = shownPullRequests({ prs: opened.filter(isOutside), policy }).filter(isRecent);
    const shown = [...prs, ...open].map(({ url }) => url);
    const names = new Set([...prs, ...open].map(({ repo }) => repo));
    const [closes, repos, lines, total] = await Promise.all([
      this.#reportsClosedBy(shown),
      this.#repositoriesOf(names),
      this.#linesOf(shown),
      host.contributionsInLastYear(author),
    ]);
    const asOf = now.toISOString().slice(0, 10);
    return { prs, open, closes, repos, lines, contributions: { total, asOf } };
  }

  // Only issues one reported oneself: fixing someone else's report is the pull request alone.
  async #reportsClosedBy(urls: string[]): Promise<ClosedIssues> {
    const { host, policy } = this.#needs;
    const closing = await host.issuesClosedBy(urls);
    const own = Object.entries(closing).map(
      ([url, issues]) =>
        [url, issues.filter((issue) => policy.isReportedByUser(issue)).map((i) => i.url)] as const,
    );
    return Object.fromEntries(own.filter(([, issues]) => issues.length));
  }

  async #repositoriesOf(names: ReadonlySet<string>) {
    const entries = [...names].map(
      async (name) => [name, await this.#askRepository(name)] as const,
    );
    return Object.fromEntries(await Promise.all(entries));
  }

  async #linesOf(urls: string[]) {
    const { host } = this.#needs;
    const entries = urls.map(async (url) => [url, await host.linesOf(url)] as const);
    return Object.fromEntries(await Promise.all(entries));
  }

  async #askRepository(name: string): Promise<Repository> {
    const { description } = await this.#needs.host.repository(name);
    return { about: aboutFrom(description) };
  }
}
