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
    "packages/frontend/src/utils/**",
    ["vue", "pinia", "@/stores/*", "@/components/*", "@/views/*"],
    "utils/ holds pure helpers. No Vue, stores, components, or views.",
  ),
  forbidImports(
    "packages/frontend/src/stores/**",
    ["@/components/*", "@/views/*"],
    "Stores hold state and talk to the backend. They do not know about components.",
  ),
];
