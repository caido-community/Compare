import { defaultConfig } from "@caido/eslint-config";

const forbidImports = (files, group, message) => ({
  files: [files],
  rules: {
    "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
  },
});

/** @type {import('eslint').Linter.Config } */
export default [
  ...defaultConfig(),
  {
    files: ["packages/backend/src/**"],
    rules: { "compat/compat": "off" },
  },
  forbidImports(
    "packages/frontend/src/core/**",
    ["vue", "@/services", "@/services/*", "@/components/*", "@/types"],
    "core/ is pure logic. No Vue, no SDK, no services or components.",
  ),
  forbidImports(
    "packages/frontend/src/services/**",
    ["vue", "@/components/*", "@/views/*"],
    "Services wrap the backend. They do not know about Vue or components.",
  ),
];
