import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { Records } from "./PullRequest.ts";
import { RepositoryDiff } from "./RepositoryDiff.ts";
import { shownChanges } from "./ShownChanges.ts";

type Work = { records: Records; policy: ContributionPolicy };

export class Contributions {
  readonly #diffs: readonly RepositoryDiff[];

  constructor({ records, policy }: Work) {
    const { prs, repos, lines } = records;
    const byRepo = Map.groupBy(shownChanges({ prs, policy }), ({ repo }) => repo);
    const diffs = [...byRepo].map(
      ([name, rows]) => new RepositoryDiff({ rows, lines, about: repos[name]?.about ?? "" }),
    );
    this.#diffs = diffs.sort((a, b) => a.compare(b));
  }

  byRepository() {
    return this.#diffs.map((diff) => diff.asChanges());
  }
}
