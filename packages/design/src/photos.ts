// Photos a site can open on. Imported, so each site serves its own copy under its own base.
import a1200 from "./assets/bund-day-1200.avif?url";
import a1920 from "./assets/bund-day-1920.avif?url";
import fallback from "./assets/bund-day-2400.webp?url";
import a2880 from "./assets/bund-day-2880.avif?url";
import a3840 from "./assets/bund-day-3840.avif?url";

export type Photo = {
  // WebP, for browsers without AVIF.
  src: string;
  // AVIF, in several widths.
  srcset: string;
  width: number;
  height: number;
  credit: { author: string; source: string; href: string };
};

const bund: Photo = {
  src: fallback,
  srcset: `${a1200} 1200w, ${a1920} 1920w, ${a2880} 2880w, ${a3840} 3840w`,
  width: 3840,
  height: 2560,
  credit: {
    author: "Jiawei Wen",
    source: "Pexels",
    href: "https://www.pexels.com/photo/the-lujiazui-skyline-across-the-huangpu-river-4118772/",
  },
};

export const photos = { bund };
