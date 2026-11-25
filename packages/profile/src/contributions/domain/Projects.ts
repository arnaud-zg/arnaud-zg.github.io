import type { ContributionPolicy } from "./ContributionPolicy.ts";
import type { Records } from "./PullRequest.ts";
import { Project } from "./Project.ts";

type Work = Pick<Records, "prs" | "repos"> & { policy: ContributionPolicy; year: number };

// Most significant first.
export class Projects {
  readonly #projects: readonly Project[];

  constructor({ prs, repos, policy, year }: Work) {
    const substantive = prs.filter((pullRequest) => policy.isSubstantive(pullRequest));
    const byRepo = Map.groupBy(substantive, ({ repo }) => repo);
    const projects = [...byRepo].flatMap(([name, pullRequests]) => {
      const repository = repos[name];
      if (!repository || !policy.hasReach(repository)) return [];
      return [new Project({ name, repository, pullRequests, policy })];
    });
    const worked = projects.filter((project) => !project.isEmpty());
    this.#projects = worked.sort((a, b) => b.scoreIn(year) - a.scoreIn(year));
  }

  shown() {
    return this.#projects.flatMap((project) => project.shown());
  }
}
