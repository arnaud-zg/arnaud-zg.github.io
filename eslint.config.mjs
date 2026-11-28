import base from "@arnaud-zg/configs/eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  { ignores: ["**/.astro/**", "**/public/**", ".preview/**"] },
  ...base,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // A value is checked (schema, instanceof, type guard), never cast; `as const` stays.
    files: ["packages/mission/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    // `test()` from node:test returns a promise nothing has to wait for.
    files: ["**/test/**"],
    rules: { "@typescript-eslint/no-floating-promises": "off" },
  },
);
