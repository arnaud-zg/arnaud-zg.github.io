import type { PublishedPackage } from "../domain/PublishedPackage.ts";

export type PackageHistory = { versions: string[]; latest?: string; created?: string };

export interface PackageRegistry {
  publishedBy(maintainer: string): Promise<PublishedPackage[]>;
  historyOf(name: string): Promise<PackageHistory>;
  // Over the last 30 days.
  downloadsOf(names: string[]): Promise<Map<string, number>>;
}
