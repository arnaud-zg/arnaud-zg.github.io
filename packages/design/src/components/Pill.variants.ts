import { defineVariants } from "../variants";

// `arrow` leads somewhere; `plain` is an answer or a choice; `quiet` is small text, for what few look for.
export const pillVariants = defineVariants(
  { look: ["arrow", "plain", "quiet"] },
  { look: "arrow" },
);
