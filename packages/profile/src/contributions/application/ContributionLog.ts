import type { ContributionPolicy } from "../domain/ContributionPolicy.ts";
import type { Records, Repository } from "../domain/PullRequest.ts";
import type { CodeHost } from "../ports/CodeHost.ts";
import { aboutFrom } from "../domain/about.ts";
import { shownChanges } from "../domain/ShownChanges.ts";

export type ContributionLogNeeds = {
  host: CodeHost;
  policy: ContributionPolicy;
  author: string;
};

export class ContributionLog {
  readonly #needs: ContributionLogNeeds;

  constructor(needs: ContributionLogNeeds) {
    this.#needs = needs;
  }

  // Only what the page shows is asked for and saved: about 20 requests of GitHub's 5,000 an hour.
  async read(): Promise<Records> {
    const { host, policy, author } = this.#needs;
    const found = await host.mergedPullRequests({ author, outside: policy.owners() });
    if (!found.length) throw new Error("no pull requests");
    const outside = found.filter((pullRequest) => !policy.isOwn(pullRequest));
    const shown = shownChanges({ prs: outside, policy });
    const urls = new Set(shown.map(({ url }) => url));
    const prs = outside.filter(({ url }) => urls.has(url));
    const repos = await this.#repositoriesOf(new Set(shown.map(({ repo }) => repo)));
    return { prs, repos, lines: await this.#linesOf([...urls]) };
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
