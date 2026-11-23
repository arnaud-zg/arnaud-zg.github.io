// Photos a site can open on. Imported, so each site serves its own copy under its own base.
import w1200 from "./assets/bund-day-1200.webp?url";
import w2400 from "./assets/bund-day-2400.webp?url";
import w3840 from "./assets/bund-day-3840.webp?url";

export type Photo = { src: string; srcset: string; width: number; height: number; credit: { author: string; source: string; href: string } };

const bund: Photo = {
  src: w2400,
  srcset: `${w1200} 1200w, ${w2400} 2400w, ${w3840} 3840w`,
  width: 3840,
  height: 2560,
  credit: { author: "Jiawei Wen", source: "Pexels", href: "https://www.pexels.com/photo/the-lujiazui-skyline-across-the-huangpu-river-4118772/" },
};

export const photos = { bund };
