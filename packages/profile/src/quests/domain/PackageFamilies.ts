import type { PublishedPackage } from "./PublishedPackage.ts";
import { PackageFamily } from "./PackageFamily.ts";

const RESERVED = /^(reserved package name|coming soon)$/i;

export type Lead = { lead: PublishedPackage; updated: string; members: number };

export class PackageFamilies {
  readonly #families: readonly PackageFamily[];

  // Parked packages are not tools yet, and do not count as plugins.
  constructor({ packages, parked }: { packages: readonly PublishedPackage[]; parked: RegExp }) {
    const tools = packages.filter(
      ({ description, version }) => !RESERVED.test(description) && !parked.test(version),
    );
    if (!tools.length) throw new Error("no packages");
    const byName = Map.groupBy(tools, (tool) => PackageFamily.nameOf(tool));
    this.#families = [...byName].map(([name, members]) => new PackageFamily({ name, members }));
  }

  leads(): Lead[] {
    return this.#families.flatMap((family) => {
      const lead = family.lead();
      return lead ? [{ lead, ...family.summary() }] : [];
    });
  }
}
