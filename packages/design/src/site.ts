// What a site tells the design about itself. Nothing here knows who the sites belong to.
import type { Photo } from "./photos";

export type SiteEntry = {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly line: string;
  readonly live: boolean;
};
// Enough for the header and the links between sites.
export type SiteLinksInfo = {
  readonly id: string;
  readonly brand: string;
  readonly sites: readonly SiteEntry[];
};
// With the photo, for a page that opens on a Hero.
export type SiteInfo = SiteLinksInfo & { readonly photo: Photo };

// PREVIEW_SITES=1 links sites that are not deployed yet, to see every site together.
const preview = process.env.PREVIEW_SITES === "1";
export const currentSite = (site: SiteLinksInfo) => site.sites.find((s) => s.id === site.id);
// Where the brand leads. Not always the root of the origin: a preview lives in a folder.
export const homePath = (site: SiteLinksInfo) =>
  site.sites.find((s) => s.id === "home")?.path ?? "/";
export const otherSites = (site: SiteLinksInfo) =>
  site.sites.filter((s) => s.id !== site.id && (s.live || preview));
