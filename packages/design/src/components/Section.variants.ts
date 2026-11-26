import { defineVariants } from "../variants";

// `tight` sits closer to what is above it: a strip of figures, or the first section under a banner.
export const sectionVariants = defineVariants(
  { space: ["default", "tight"] },
  { space: "default" },
);
