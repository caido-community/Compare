import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vitest/config";

import { PLUGIN_DEFINES } from "./caido.config";

export default defineConfig({
  plugins: [vue({ include: [/\.vue$/] })],
  define: PLUGIN_DEFINES,
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "packages/frontend/src"),
      },
      {
        find: /^vue$/,
        replacement: path.resolve(
          __dirname,
          "packages/frontend/node_modules/vue",
        ),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["packages/**/*.spec.ts"],
  },
});
