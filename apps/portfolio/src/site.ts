// This site, as the design package wants it: portfolio.config.ts plus the photo it names.
import type { SiteInfo } from "@arnaud-zg/design/site";
import { photos } from "@arnaud-zg/design/photos";
import { getImage } from "astro:assets";

import config from "../portfolio.config";
import profile from "./assets/profile.jpeg";

export const siteInfo: SiteInfo = {
  id: config.site.id,
  brand: config.site.brand,
  sites: config.sites,
  photo: photos[config.site.photo],
};

// Shown at 160px: twice that, for sharp screens.
const small = await getImage({ src: profile, width: 320, format: "avif" });
export const portrait = { src: small.src, alt: config.portraitAlt };
