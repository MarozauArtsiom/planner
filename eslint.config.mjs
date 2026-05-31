import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // GSD Core install artifacts — third-party (open-gsd/gsd-core), not our codebase
    ".claude/**",
    // GSD planning artifacts (local-only, see .gitignore)
    ".planning/**",
    // Generated Prisma client
    "src/generated/**",
  ]),
]);

export default eslintConfig;
