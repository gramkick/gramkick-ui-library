import { defineConfig } from "tsup";

/**
 * Two entry points:
 *   .        -> dist/index.js        (components + tokens helper)
 *   ./hooks  -> dist/hooks/index.js  (framework-agnostic hooks)
 *
 * React is a peer dependency, so it is marked external and never bundled.
 * `"use client"` is added to the bundled entries by scripts/add-directives.mjs
 * after the build (tsup's banner is dropped once an entry has imports).
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "hooks/index": "src/hooks/index.ts",
  },
  format: ["esm"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  splitting: true,
  external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
});
