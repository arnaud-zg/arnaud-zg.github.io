import { defineVariants } from "../variants";

// `wide` holds a table or a grid; `narrow` holds one list, read top to bottom.
export const dialogVariants = defineVariants({ size: ["wide", "narrow"] }, { size: "wide" });
