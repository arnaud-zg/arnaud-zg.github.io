// A repository's description, down to its first plain sentence.
export const aboutFrom = (description: string): string =>
  description
    .replace(/\p{Extended_Pictographic}|️|:[a-z_]+:/gu, "")
    .trim()
    .replace(/\s*\([^)]*\)/g, "")
    .split(" | ")[0]
    .split(/(?<=[.!])\s/)[0]
    .replace(/[.!]$/, "")
    .replace(/^A delightful community-driven framework/, "Framework")
    .trim();
