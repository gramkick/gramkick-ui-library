// Prepend the `"use client"` directive to the bundled entries.
//
// tsup's `banner` option emits an esbuild warning and drops the directive once
// the entry has imports, so we add it here as a deterministic post-build step.
// Every component in this package is a Client Component (hooks, refs, Radix),
// which lets the Next.js shell import them from Server Components safely.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const targets = ["index.js", "hooks/index.js"];
const directive = '"use client";\n';

for (const file of targets) {
  const path = resolve(dist, file);
  const source = readFileSync(path, "utf8");
  if (source.startsWith('"use client"') || source.startsWith("'use client'")) continue;
  writeFileSync(path, directive + source);
  console.log(`added "use client" -> dist/${file}`);
}
