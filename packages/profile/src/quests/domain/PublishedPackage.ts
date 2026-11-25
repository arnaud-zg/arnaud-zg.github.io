export type PublishedPackage = {
  readonly name: string;
  readonly version: string;
  readonly date: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly href: string;
};
