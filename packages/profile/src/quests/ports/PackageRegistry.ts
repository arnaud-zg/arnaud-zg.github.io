import type { Month } from "../../shared/domain/Month.ts";
import type { PublishedPackage } from "../domain/PublishedPackage.ts";

// The day each version was published, as YYYY-MM-DD.
export type Versions = Readonly<Record<string, string>>;

export interface PackageRegistry {
  publishedBy(maintainer: string): Promise<PublishedPackage[]>;
  versionsOf(name: string): Promise<Versions>;
  downloadsIn(asked: { month: Month; names: string[] }): Promise<Map<string, number>>;
}
