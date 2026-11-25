import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { Records } from "./PullRequest.ts";
import { Projects } from "./Projects.ts";
import { RepositoryDiff } from "./RepositoryDiff.ts";

type Work = { records: Records; policy: ContributionPolicy; year: number };

export class Contributions {
  readonly #diffs: readonly RepositoryDiff[];

  constructor({ records, policy, year }: Work) {
    const { prs, repos, lines } = records;
    const shown = new Projects({ prs, repos, policy, year }).shown();
    const byRepo = Map.groupBy(shown, ({ repo }) => repo);
    const diffs = [...byRepo.values()].map((rows) => new RepositoryDiff({ rows, lines }));
    this.#diffs = diffs.sort((a, b) => a.compare(b));
  }

  byRepository() {
    return this.#diffs.map((diff) => diff.asChanges());
  }
}
