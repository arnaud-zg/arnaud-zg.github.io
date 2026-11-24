// This site, as the design package wants it: portfolio.config.ts plus the photo it names.
import type { SiteInfo } from "@arnaud-zg/design/site";
import { photos } from "@arnaud-zg/design/photos";

import config from "../portfolio.config";
import profile from "./assets/profile.jpeg";

export const siteInfo: SiteInfo = {
  id: config.site.id,
  brand: config.site.brand,
  sites: config.sites,
  photo: photos[config.site.photo],
};

export const portrait = { src: profile.src, alt: config.portraitAlt };
