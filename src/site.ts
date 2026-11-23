// This site, as the design package wants it: portfolio.config.ts plus the photo it names.
import { photos } from "@arnaud-zg/design/photos";
import type { SiteInfo } from "@arnaud-zg/design/site";
import config from "../portfolio.config";

export const siteInfo: SiteInfo = { id: config.site.id, brand: config.site.brand, sites: config.sites, photo: photos[config.site.photo] };
