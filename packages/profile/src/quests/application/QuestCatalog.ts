import type { Month } from "../../shared/domain/Month.ts";
import type { Lead } from "../domain/PackageFamilies.ts";
import type { QuestFacts } from "../domain/Quest.ts";
import type { PackageRegistry } from "../ports/PackageRegistry.ts";
import { PackageFamilies } from "../domain/PackageFamilies.ts";
import { Quest } from "../domain/Quest.ts";

export type QuestCatalogNeeds = {
  registry: PackageRegistry;
  today: Month;
  maintainer: string;
  parked: RegExp;
  lines: Readonly<Record<string, string | undefined>>;
};

export class QuestCatalog {
  readonly #needs: QuestCatalogNeeds;

  constructor(needs: QuestCatalogNeeds) {
    this.#needs = needs;
  }

  async read(): Promise<QuestFacts[]> {
    const { registry, maintainer, parked } = this.#needs;
    const packages = await registry.publishedBy(maintainer);
    const leads = new PackageFamilies({ packages, parked }).leads();
    const downloads = await this.#downloadsOf(leads.map(({ lead }) => lead.name));
    const quests = await Promise.all(leads.map((lead) => this.#questOf({ ...lead, downloads })));
    return quests.sort((a, b) => b.releases - a.releases || a.name.localeCompare(b.name));
  }

  async #questOf({
    lead,
    updated,
    members,
    names,
    downloads,
  }: Lead & { downloads: Map<string, number> }) {
    const { registry, parked, lines, today } = this.#needs;
    const { name, href, keywords, description } = lead;
    // A tool releases through its plugins too: every package of the family counts.
    const dates = (await Promise.all(names.map((one) => registry.versionsOf(one)))).flatMap(
      (versions) =>
        Object.entries(versions).flatMap(([one, date]) =>
          Quest.isRelease(one, parked) ? [date] : [],
        ),
    );
    const month = today.previous();
    // This month so far and the eleven before it: the last year, up to the refresh.
    const isInYear = (date: string) => date !== "" && today.monthsSince(date) < 12;
    return {
      name,
      month: month.label(),
      downloads: downloads.get(name),
      line: lines[name] ?? Quest.lineFrom(description),
      href,
      keywords: [...keywords],
      updated,
      members,
      releases: dates.length,
      monthlyReleases: dates.filter((date) => date && month.includes(date)).length,
      yearlyReleases: dates.filter(isInYear).length,
    };
  }

  #downloadsOf(names: string[]): Promise<Map<string, number>> {
    const { registry, today } = this.#needs;
    return registry.downloadsIn({ month: today.previous(), names });
  }
}
