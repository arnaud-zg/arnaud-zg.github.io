import type { ContributionPolicy } from "../domain/ContributionPolicy.ts";
import type { PullRequest, Records, Repository } from "../domain/PullRequest.ts";
import type { CodeHost } from "../ports/CodeHost.ts";
import { aboutFrom } from "../domain/about.ts";
import { Projects } from "../domain/Projects.ts";

export type ContributionLogNeeds = {
  host: CodeHost;
  policy: ContributionPolicy;
  author: string;
  year: number;
};

export class ContributionLog {
  readonly #needs: ContributionLogNeeds;

  constructor(needs: ContributionLogNeeds) {
    this.#needs = needs;
  }

  // About 20 requests of GitHub's 5,000 an hour.
  async read(): Promise<Records> {
    const { host, policy, author, year } = this.#needs;
    const found = await host.mergedPullRequests({ author, outside: policy.owners() });
    if (!found.length) throw new Error("no pull requests");
    const repos = await this.#repositoriesOf(found);
    const prs = found.filter((pullRequest) => !policy.isOwn(pullRequest));
    const shown = new Projects({ prs, repos, policy, year }).shown();
    const lines = await this.#linesOf(shown.map(({ url }) => url));
    return { prs, repos, lines };
  }

  async #repositoriesOf(found: PullRequest[]) {
    const { policy } = this.#needs;
    const substantive = found.filter((pullRequest) => policy.isSubstantive(pullRequest));
    const asked = new Set(substantive.map(({ repo }) => repo));
    const entries = [...asked].map(
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
    const { stars, description } = await this.#needs.host.repository(name);
    return { stars, about: aboutFrom(description) };
  }
}
