import type { PublishedPackage } from "./PublishedPackage.ts";

// A tool and its scoped plugins, such as tool and @tool/plugin, count as one.
export class PackageFamily {
  readonly #name: string;
  readonly #members: readonly PublishedPackage[];

  constructor({ name, members }: { name: string; members: readonly PublishedPackage[] }) {
    this.#name = name;
    this.#members = members;
  }

  static nameOf({ name }: PublishedPackage): string {
    return name.startsWith("@") ? name.slice(1).split("/")[0] : name;
  }

  // The package that names the family. Without a description, there is nothing to show.
  lead(): PublishedPackage | undefined {
    return this.#members.find(({ name, description }) => name === this.#name && description);
  }

  summary() {
    const dates = this.#members.map(({ date }) => date).sort();
    const names = this.#members.map(({ name }) => name);
    return { updated: dates.at(-1) ?? "", members: names.length, names };
  }
}
