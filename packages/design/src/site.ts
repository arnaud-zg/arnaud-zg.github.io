// What a site tells the design about itself. Nothing here knows who the sites belong to.
import type { Photo } from "./photos";

export type SiteEntry = { readonly id: string; readonly label: string; readonly path: string; readonly line: string; readonly live: boolean };
export type SiteInfo = {
  readonly id: string;
  readonly brand: string;
  readonly sites: readonly SiteEntry[];
  readonly photo: Photo;
};

// PREVIEW_SITES=1 links sites that are not deployed yet, to see every site together.
const preview = process.env.PREVIEW_SITES === "1";
export const currentSite = (site: SiteInfo) => site.sites.find((s) => s.id === site.id);
export const otherSites = (site: SiteInfo) => site.sites.filter((s) => s.id !== site.id && (s.live || preview));
