import type { PublishedPackage } from "../domain/PublishedPackage.ts";
import type { PackageRegistry } from "../ports/PackageRegistry.ts";

export type MemoryPackage = PublishedPackage & {
  readonly versions: readonly string[];
  readonly created?: string;
  readonly downloads?: number;
};

export const memoryRegistry = ({
  packages,
  maintainer,
}: {
  packages: readonly MemoryPackage[];
  maintainer: string;
}): PackageRegistry => ({
  publishedBy: (asked) =>
    Promise.resolve(
      asked === maintainer
        ? packages.map(({ name, version, date, description, keywords, href }) => ({
            name,
            version,
            date,
            description,
            keywords,
            href,
          }))
        : [],
    ),

  async historyOf(name) {
    const found = await Promise.resolve(packages.find((one) => one.name === name));
    if (!found) throw new Error(`404 ${name}`);
    return { versions: [...found.versions], latest: found.version, created: found.created };
  },

  downloadsOf(names) {
    const asked = packages.filter(({ name }) => names.includes(name));
    const figures = asked.flatMap(({ name, downloads }) =>
      downloads === undefined ? [] : [[name, downloads] as const],
    );
    return Promise.resolve(new Map(figures));
  },
});
