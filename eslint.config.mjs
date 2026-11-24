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
    // `test()` from node:test returns a promise nothing has to wait for.
    files: ["**/test/**"],
    rules: { "@typescript-eslint/no-floating-promises": "off" },
  },
);
