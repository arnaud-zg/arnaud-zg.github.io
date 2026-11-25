import type { SavedData } from "../../shared/application/SavedData.ts";
import type { ContributionPolicy } from "../domain/ContributionPolicy.ts";
import type { Lines, PullRequest, Records, Repository } from "../domain/PullRequest.ts";
import type { CodeHost } from "../ports/CodeHost.ts";
import { aboutFrom } from "../domain/about.ts";
import { Projects } from "../domain/Projects.ts";

export type ContributionLogNeeds = {
  host: CodeHost;
  savedData: SavedData;
  policy: ContributionPolicy;
  author: string;
  year: number;
  saved: Records;
};
type Known = Pick<Records, "repos" | "lines">;

export class ContributionLog {
  readonly #needs: ContributionLogNeeds;

  constructor(needs: ContributionLogNeeds) {
    this.#needs = needs;
  }

  // Fresh asks again for what is saved. GitHub allows 60 requests an hour; it makes about 20.
  async read({ fresh = false } = {}): Promise<Records> {
    const { host, policy, author, year, saved } = this.#needs;
    const known: Known = fresh ? { repos: {}, lines: {} } : saved;
    const found = await host.mergedPullRequests({ author, outside: policy.owners() });
    if (!found.length) throw new Error("no pull requests");
    const repos = await this.#repositoriesOf({ found, known });
    const prs = found.filter((pullRequest) => !policy.isOwn(pullRequest));
    const shown = new Projects({ prs, repos, policy, year }).shown();
    const lines = await this.#linesOf({ urls: shown.map(({ url }) => url), known });
    return { prs, repos, lines };
  }

  async #repositoriesOf({ found, known }: { found: PullRequest[]; known: Known }) {
    const { policy } = this.#needs;
    const substantive = found.filter((pullRequest) => policy.isSubstantive(pullRequest));
    const asked = new Set(substantive.map(({ repo }) => repo));
    const entries = [...asked].map(async (name) => {
      const repository = known.repos[name] ?? (await this.#askRepository(name));
      return [name, repository] as const;
    });
    return Object.fromEntries(await Promise.all(entries));
  }

  async #linesOf({ urls, known }: { urls: string[]; known: Known }) {
    const entries = urls.map(async (url) => {
      const lines = known.lines[url] ?? (await this.#askLines(url));
      return [url, lines] as const;
    });
    return Object.fromEntries(await Promise.all(entries));
  }

  async #askRepository(name: string): Promise<Repository> {
    const { stars, description } = await this.#needs.host.repository(name);
    return { stars, about: aboutFrom(description) };
  }

  #askLines(url: string): Promise<Lines | undefined> {
    const { host, saved, savedData } = this.#needs;
    const lines = savedData.insteadOf({ source: "github", saved: saved.lines[url] });
    return host.linesOf(url).catch(lines);
  }
}
