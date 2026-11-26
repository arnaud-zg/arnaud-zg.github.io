import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { Records } from "./PullRequest.ts";
import { RepositoryDiff } from "./RepositoryDiff.ts";
import { shownChanges } from "./ShownChanges.ts";

type Work = { records: Records; policy: ContributionPolicy };

// Merged work, by repository: the record.
export class Contributions {
  readonly #diffs: readonly RepositoryDiff[];
  readonly #years: readonly number[];

  constructor({ records, policy }: Work) {
    const { prs, repos, lines } = records;
    const changes = shownChanges({ prs, policy });
    const byRepo = Map.groupBy(changes, ({ repo }) => repo);
    const diffs = [...byRepo].map(
      ([name, rows]) => new RepositoryDiff({ rows, lines, about: repos[name]?.about ?? "" }),
    );
    this.#diffs = diffs.sort((a, b) => a.compare(b));
    this.#years = changes.map(({ year }) => year);
  }

  byRepository() {
    return this.#diffs.map((diff) => diff.asChanges());
  }

  // "7 merged in 6 projects, 2019–2023".
  summary() {
    const years = this.#years;
    const span = years.length ? { from: Math.min(...years), to: Math.max(...years) } : undefined;
    return { merged: years.length, projects: this.#diffs.length, ...span };
  }
}
