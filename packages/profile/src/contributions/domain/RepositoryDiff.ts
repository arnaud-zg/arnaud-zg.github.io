import type { Projects } from "./Projects.ts";
import type { LinesByUrl } from "./PullRequest.ts";
import { summaryOf } from "./kinds.ts";

type Row = ReturnType<Projects["shown"]>[number];

export class RepositoryDiff {
  readonly #rows: readonly Row[];
  readonly #lines: LinesByUrl;

  constructor({ rows, lines }: { rows: readonly Row[]; lines: LinesByUrl }) {
    this.#lines = lines;
    this.#rows = [...rows].sort((a, b) => this.#sizeOf(b) - this.#sizeOf(a) || b.year - a.year);
  }

  // Largest first, ties to the most recent.
  compare(other: RepositoryDiff): number {
    return other.#size() - this.#size() || other.#latest() - this.#latest();
  }

  asChanges() {
    const [{ repo, about }] = this.#rows;
    const kinds = summaryOf(this.#rows.map(({ kind }) => kind));
    return { repo, about, added: this.#total(0), removed: this.#total(1), kinds };
  }

  #sizeOf({ url }: Row): number {
    const [added, removed] = this.#lines[url] ?? [0, 0];
    return added + removed;
  }

  #size(): number {
    return this.#total(0) + this.#total(1);
  }

  #total(side: 0 | 1): number {
    return this.#rows.reduce((total, { url }) => total + (this.#lines[url]?.[side] ?? 0), 0);
  }

  #latest(): number {
    return Math.max(...this.#rows.map(({ year }) => year));
  }
}
