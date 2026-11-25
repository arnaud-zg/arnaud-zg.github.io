import type { SavedData } from "../../shared/application/SavedData.ts";
import type { Month } from "../../shared/domain/Month.ts";
import type { Lead } from "../domain/PackageFamilies.ts";
import type { QuestFacts } from "../domain/Quest.ts";
import type { PackageRegistry } from "../ports/PackageRegistry.ts";
import { PackageFamilies } from "../domain/PackageFamilies.ts";
import { Quest } from "../domain/Quest.ts";

export type QuestCatalogNeeds = {
  registry: PackageRegistry;
  savedData: SavedData;
  today: Month;
  maintainer: string;
  parked: RegExp;
  lines: Readonly<Record<string, string | undefined>>;
  pause: () => Promise<unknown>;
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

  async #questOf({ lead, updated, members, downloads }: Lead & { downloads: Map<string, number> }) {
    const { registry, parked, lines, today } = this.#needs;
    const { name, href, keywords, description } = lead;
    const { versions, latest, created } = await registry.historyOf(name);
    return {
      name,
      downloads: downloads.get(name),
      downloadsMonth: downloads.has(name) ? today.previous().label() : undefined,
      line: lines[name] ?? Quest.lineFrom(description),
      href,
      keywords: [...keywords],
      updated,
      members,
      releases: versions.filter((version) => !parked.test(version)).length,
      version: latest,
      created,
    };
  }

  // One retry after a short pause, then the figures are left out.
  async #downloadsOf(names: string[]): Promise<Map<string, number>> {
    const { registry, savedData, today, pause } = this.#needs;
    const ask = () => registry.downloadsIn({ month: today.previous(), names });
    const saved = new Map<string, number>();
    return ask()
      .catch(() => pause().then(ask))
      .catch((error: unknown) => savedData.insteadOf({ source: "npm downloads", error, saved }));
  }
}
