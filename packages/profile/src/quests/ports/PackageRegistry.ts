import type { Month } from "../../shared/domain/Month.ts";
import type { PublishedPackage } from "../domain/PublishedPackage.ts";

export type PackageHistory = { versions: string[]; latest?: string; created?: string };

export interface PackageRegistry {
  publishedBy(maintainer: string): Promise<PublishedPackage[]>;
  historyOf(name: string): Promise<PackageHistory>;
  downloadsIn(asked: { month: Month; names: string[] }): Promise<Map<string, number>>;
}
