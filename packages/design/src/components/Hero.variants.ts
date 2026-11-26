import { defineVariants } from "../variants";

// `full` fills the screen (home); `banner` is the short photo sub-sites open on.
export const heroVariants = defineVariants({ size: ["banner", "full"] }, { size: "banner" });
